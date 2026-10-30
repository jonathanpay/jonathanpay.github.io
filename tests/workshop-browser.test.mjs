// Browser checks (PRD T02, T03, T09-T11) against the real pages. The collector is Code.gs run in-process
// behind a routed fake of script.google.com, so these are SIMULATIONS of the deployment path, not deployed checks.
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {load, record} from './workshop/harness.mjs';
import {serve, wire, complete, chromium, COLLECTOR_URL, PILOT_URL} from './workshop/browser.mjs';

const KEY = 'z'.repeat(8) + 'a1b2c3d4e5f60718293a4b5c6d7e8f90abcdef12';
const SHOTS = process.env.WORKSHOP_SHOTS || '';
const shot = async (page, name, opts = {}) => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: `${SHOTS}/${name}.png`, ...opts}); } };
const PARTICIPANT = '/workshops/london-forum/email-maturity-assessment/';
const DASH = '/workshops/london-forum/dashboard/';
let srv, browser;
before(async () => { srv = await serve(); browser = await chromium.launch(); });
after(async () => { await browser.close(); srv.server.close(); });
const collector = () => load().configure().setKey(KEY);
const fresh = async (c, o, vp = {width: 390, height: 844}) => {
  const context = await browser.newContext({viewport: vp, acceptDownloads: true});
  const log = await wire(context, c, o);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  return {context, page, log, errors};
};
const GOOD = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 2, 2, 2, 4, 4, 4].map(s => s - 1); // option indexes; Testing & Learning is the only lowest area (Foundational)
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('participant: full 390px flow saves to the workshop session only; result is private and complete', async () => {
  const c = collector();
  const {context, page, log, errors} = await fresh(c);
  await page.goto(srv.origin + PARTICIPANT + '?session=lf-rehearsal');
  await page.waitForSelector('.env-tag');
  assert.match(await page.textContent('#collect-notice'), /Rehearsal/);
  assert.match(await page.textContent('#collect-notice'), /saved privately/);
  assert.match(await page.textContent('.hero'), /We do not ask for your name or email/);
  await shot(page, 'participant-01-intro-390');
  assert.ok(await noOverflow(page));
  await complete(page, GOOD);
  await page.waitForSelector('#save-status:has-text("saved to this workshop session")');
  assert.match(await page.textContent('.takeaway'), /Focus/);
  assert.match(await page.textContent('.takeaway'), /Testing & Learning/); // only area at lowest level (2)
  assert.equal(await page.locator('#email-form, #c-email, .email-copy').count(), 0, 'no contact capture');
  assert.ok(await noOverflow(page));
  await shot(page, 'participant-02-result-390', {fullPage: true});
  assert.equal(c.responses().length, 2);
  const h = c.responses()[0], row = c.responses()[1];
  assert.equal(row[h.indexOf('Session')], 'lf-rehearsal');
  assert.equal(row[h.indexOf('Overall level')], 'Foundational');
  assert.ok(log.external.every(u => u.startsWith(COLLECTOR_URL)), 'only the workshop collector was contacted');
  assert.ok(log.external.every(u => !u.includes('AKfycbyGg')));
  for (const body of log.posts) { const r = JSON.parse(body); assert.ok(!('contact' in r)); assert.equal(r.schema, 'hea-assessment-workshop-v1'); assert.equal(r.sessionId, 'lf-rehearsal'); }
  assert.deepEqual(errors, []);
  await context.close();
});

test('T02 missing config, pilot URL, no session, unknown and closed sessions: nothing is submitted', async () => {
  const cases = [
    ['empty collector URL', {collectorUrl: ''}, '?session=lf-rehearsal', /collector is not set up/],
    ['pilot collector URL', {collectorUrl: PILOT_URL}, '?session=lf-rehearsal', /collector is not set up/],
    ['no session in link', {}, '', /does not name a workshop session/],
    ['unknown session', {}, '?session=nope', /not recognised/],
    ['closed session', {}, '?session=lf-live-closed', /session is closed/]
  ];
  for (const [name, opts, qs, notice] of cases) {
    const c = collector();
    const {context, page, log} = await fresh(c, opts);
    await page.goto(srv.origin + PARTICIPANT + qs);
    await page.waitForSelector('.collect-warning');
    assert.match(await page.textContent('#collect-notice'), notice, name);
    await shot(page, 'participant-off-' + name.replace(/\W+/g, '-'));
    await complete(page, GOOD);
    await page.waitForSelector('.result-head');
    assert.match(await page.textContent('#save-status'), /switched off|not recognised|closed|not submitted/, name);
    assert.equal(log.posts.length, 0, name + ': no POST');
    assert.ok(log.external.every(u => !u.includes('AKfycbyGg')), name + ': pilot never contacted');
    assert.equal(c.responses().length, 1, name + ': sheet untouched');
    await context.close();
  }
});

test('T03/T09 failures retry, never show Saved for unconfirmed data, and the latest state wins', async () => {
  const c = collector();
  let fail = 0;
  const {context, page, log} = await fresh(c, {hooks: {beforePost: (_b, n) => (fail > 0 ? (fail--, {fail: true}) : n === 99 ? {raw: '<html>Error</html>'} : null)}});
  await page.goto(srv.origin + PARTICIPANT + '?session=lf-rehearsal');
  await page.waitForSelector('.env-tag');
  fail = 2; // first two attempts fail, third works
  await complete(page, GOOD);
  await page.waitForSelector('#save-status:has-text("Trying again")');
  assert.doesNotMatch(await page.textContent('#save-status'), /saved to this workshop/);
  assert.equal(c.responses().length, 1, 'nothing committed while failing');
  await page.waitForSelector('#save-status:has-text("saved to this workshop session")', {timeout: 20000});
  assert.equal(c.responses().length, 2);
  assert.equal(log.posts.length, 3);
  // Same response ID on every attempt, increasing revisions.
  const recs = log.posts.map(b => JSON.parse(b));
  assert.equal(new Set(recs.map(r => r.responseId)).size, 1);
  assert.deepEqual(recs.map(r => r.saveRevision), [1, 2, 3]);

  // Rapid edits: the last state is what is stored, and Saved appears only after it is.
  for (const text of ['one', 'two', 'FINAL']) { await page.fill('#feedback', text); await page.dispatchEvent('#feedback', 'change'); }
  await page.waitForSelector('#save-status:has-text("saved to this workshop session")');
  await page.waitForFunction(() => document.getElementById('save-status').textContent.includes('saved to this'));
  const h = c.responses()[0];
  assert.equal(c.responses()[1][h.indexOf('Feedback (private)')], 'FINAL');
  assert.equal(c.responses().length, 2);

  // A later failure must not be masked by an earlier success.
  fail = 100;
  await page.fill('#feedback', 'after outage'); await page.dispatchEvent('#feedback', 'change');
  await page.waitForSelector('#save-status:has-text("Trying again")');
  assert.doesNotMatch(await page.textContent('#save-status'), /saved to this workshop/);
  assert.equal(c.responses()[1][h.indexOf('Feedback (private)')], 'FINAL');
  await shot(page, 'participant-03-save-retrying-390');
  await context.close();
});

test('T09 a non-JSON or unconfirmed reply is not treated as saved', async () => {
  const c = collector();
  const {context, page} = await fresh(c, {hooks: {beforePost: () => ({raw: '<html>Quota exceeded</html>'})}});
  await page.goto(srv.origin + PARTICIPANT + '?session=lf-rehearsal');
  await page.waitForSelector('.env-tag');
  await complete(page, GOOD);
  await page.waitForSelector('#save-status:has-text("Trying again")');
  assert.doesNotMatch(await page.textContent('#save-status'), /saved to this workshop/);
  assert.match(await page.textContent('.result-head h1'), /Foundational/, 'personal result still shown');
  await context.close();
  const ctx2 = await browser.newContext({viewport: {width: 390, height: 844}});
  const log2 = await wire(ctx2, c, {hooks: {beforePost: () => ({raw: JSON.stringify({ok: true})})}});
  const p2 = await ctx2.newPage();
  await p2.goto(srv.origin + PARTICIPANT + '?session=lf-rehearsal');
  await p2.waitForSelector('.env-tag');
  await complete(p2, GOOD);
  await p2.waitForSelector('#save-status:has-text("Trying again")');
  assert.doesNotMatch(await p2.textContent('#save-status'), /saved to this workshop/, 'ok:true alone is not a confirmation');
  await ctx2.close();
});

test('T10 download then reopen round-trips locally and sends nothing; malformed and wrong-version files are rejected', async () => {
  const c = collector();
  const {context, page, log} = await fresh(c, {}, {width: 1280, height: 900});
  await page.goto(srv.origin + PARTICIPANT + '?session=lf-rehearsal');
  await page.waitForSelector('.env-tag');
  await complete(page, [5, 5, 5, ...GOOD.slice(3)]);
  await page.waitForSelector('#save-status:has-text("saved to this workshop session")');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
  const file = await dl.path();
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(saved.schema, 'hea-assessment-workshop-v1');
  assert.equal(saved.sessionId, 'lf-rehearsal');
  const posts = log.posts.length, rows = c.responses().length;
  await page.goto(srv.origin + PARTICIPANT + '?session=lf-rehearsal');
  await page.waitForSelector('#import');
  await page.setInputFiles('#file', file);
  await page.waitForSelector('.result-head');
  assert.match(await page.textContent('#save-status'), /not sent anywhere/);
  await page.fill('#feedback', 'edited after import'); await page.dispatchEvent('#feedback', 'change');
  await page.waitForTimeout(300);
  assert.equal(log.posts.length, posts, 'imported edits are not posted');
  assert.equal(c.responses().length, rows);
  const bad = {malformed: '{not json', wrong: JSON.stringify({...saved, questionnaireVersion: 'V1'}), pilot: JSON.stringify({...saved, schema: 'hea-assessment-pilot-v1'}), short: JSON.stringify({...saved, answers: saved.answers.slice(1)})};
  for (const [name, text] of Object.entries(bad)) {
    await page.goto(srv.origin + PARTICIPANT + '?session=lf-rehearsal');
    await page.waitForSelector('#import');
    await page.setInputFiles('#file', {name: name + '.json', mimeType: 'application/json', buffer: Buffer.from(text)});
    await page.waitForFunction(() => document.getElementById('import-error').textContent.length > 0);
    assert.equal(await page.locator('.result-head').count(), 0, name);
  }
  assert.equal(log.posts.length, posts);
  await context.close();
});

async function seed(c, n, session = 'lf-rehearsal', start = 0) {
  let s = 9; const rand = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = start; i < start + n; i++) {
    const base = 1 + Math.floor(rand() * 5);
    const a = Array.from({length: 17}, () => rand() < 0.1 ? null : Math.max(1, Math.min(5, base + Math.round((rand() - 0.5) * 3))));
    if (i % 4 === 0) a.fill(base);
    c.post(record(a, {responseId: 'HEA-SEED' + String(i).padStart(3, '0'), sessionId: session, feedback: 'SECRET NOTE', p1: {status: i % 2 ? 'answered' : 'skipped', obstacle: i % 2 ? i % 9 : null, area: null}}));
  }
}
const connect = async (page, key = KEY, session = 'lf-rehearsal') => { await page.selectOption('#session', session); await page.fill('#key', key); await page.click('#connect-btn'); };

test('dashboard: access, aggregate-only payload, snapshot, freeze, stale and hidden controls', async () => {
  const c = collector();
  await seed(c, 14);
  const {context, page, log, errors} = await fresh(c, {}, {width: 1920, height: 1080});
  await page.goto(srv.origin + DASH);
  assert.match(await page.textContent('#board'), /Not connected/);
  await shot(page, 'dashboard-00-not-connected-1080p');
  // wrong key
  await connect(page, 'x'.repeat(64));
  await page.waitForSelector('.banner.err');
  assert.match(await page.textContent('#banner'), /did not accept/);
  assert.equal(await page.locator('.matrix').count(), 0);
  await shot(page, 'dashboard-01-wrong-key-1080p');
  await page.click('#disconnect').catch(() => {});
  await connect(page);
  await page.waitForSelector('.matrix');
  assert.equal(await page.textContent('#count'), '14');
  assert.match(await page.textContent('#title'), /Rehearsal/);
  await shot(page, 'dashboard-02-live-snapshot-1080p');
  // what the browser actually received and sent
  const sent = log.bodies.map(b => JSON.parse(b));
  assert.ok(sent.every(b => b.action === 'aggregate' && b.session === 'lf-rehearsal'));
  assert.ok(log.external.every(u => !u.includes(KEY) && !u.includes('key=')), 'key never in a URL');
  const html = await page.content();
  for (const bad of ['SECRET NOTE', 'HEA-SEED', 'responseId', KEY]) assert.ok(!html.includes(bad), bad);
  // freeze blocks refresh
  const before = log.posts.length;
  await page.click('#freeze');
  assert.equal(await page.isDisabled('#refresh'), true);
  await page.keyboard.press('r');
  await page.waitForTimeout(150);
  assert.equal(log.posts.length, before);
  assert.match(await page.textContent('#mode'), /Frozen/);
  await shot(page, 'dashboard-03-frozen-1080p');
  await page.click('#freeze');
  await page.waitForFunction(n => true, 0);
  // new submission is visible only after refresh
  seed(c, 0);
  const t0 = await page.textContent('#snapshot');
  // failure keeps the last good snapshot and its time
  const ctx2 = context;
  await ctx2.unroute(/^https:\/\/script\.google\.com\//);
  await ctx2.route(/^https:\/\/script\.google\.com\//, r => r.abort('failed'));
  await page.click('#refresh');
  await page.waitForSelector('.banner.err');
  assert.match(await page.textContent('#banner'), /Still showing the snapshot from/);
  assert.equal(await page.textContent('#count'), '14');
  assert.match(await page.textContent('#mode'), /Stale/);
  assert.equal((await page.textContent('#snapshot')).split(' ')[0], t0.split(' ')[0], 'timestamp not advanced by a failed refresh');
  await shot(page, 'dashboard-04-stale-1080p');
  await page.keyboard.press('h');
  assert.equal(await page.isVisible('#controls'), false);
  await shot(page, 'dashboard-05-projection-controls-hidden-1080p');
  assert.equal(errors.length, 0, errors.join());
  await context.close();
});

test('dashboard: empty, below-threshold (no breakdown in the payload), exactly-threshold, session separation', async () => {
  const c = collector();
  const {context, page, log} = await fresh(c, {}, {width: 1920, height: 1080});
  await page.goto(srv.origin + DASH);
  await connect(page);
  await page.waitForSelector('.empty h2:has-text("No submitted assessments yet")');
  await shot(page, 'dashboard-06-empty-1080p');
  await seed(c, 3);
  await page.click('#refresh');
  await page.waitForSelector('.empty h2:has-text("3 submitted so far")');
  assert.equal(await page.locator('.matrix').count(), 0);
  const resp = JSON.parse(JSON.stringify(c.post({action: 'aggregate', session: 'lf-rehearsal', key: KEY})));
  assert.deepEqual(resp.data, {submitted: 3, status: 'below-threshold'}, 'the payload itself carries no breakdown');
  await shot(page, 'dashboard-07-below-threshold-1080p');
  await page.click('#synthetic');
  await page.waitForSelector('.banner.synth');
  assert.match(await page.textContent('#banner'), /SYNTHETIC EXAMPLE/);
  assert.match(await page.textContent('#count'), /synthetic/);
  await shot(page, 'dashboard-08-synthetic-1080p');
  await page.click('#synthetic');
  await seed(c, 2, 'lf-rehearsal', 3);
  await page.click('#refresh');
  await page.waitForSelector('.matrix'); // exactly 5
  assert.equal(await page.textContent('#count'), '5');
  await shot(page, 'dashboard-09-exactly-threshold-1080p');
  // live session is separate
  await page.click('#disconnect');
  await connect(page, KEY, 'lf-live-1');
  await page.waitForSelector('.empty h2:has-text("No submitted assessments yet")');
  assert.match(await page.textContent('#title'), /Live/);
  await context.close();
});

test('dashboard: unknown-heavy room keeps uncertainty visible; 390px layout works', async () => {
  const c = collector();
  for (let i = 0; i < 6; i++) c.post(record(Array(17).fill(null), {responseId: 'HEA-UNK0' + i}));
  const {context, page} = await fresh(c, {}, {width: 390, height: 844});
  await page.goto(srv.origin + DASH);
  await connect(page);
  await page.waitForSelector('.matrix');
  assert.match(await page.textContent('.areas'), /Unconfirmed/);
  assert.match(await page.textContent('#h-lim + p'), /Not shown/);
  assert.ok(await noOverflow(page));
  await shot(page, 'dashboard-10-unknown-heavy-390', {fullPage: true});
  await context.close();
});

test('T11 presentation: keyboard reachable controls', async () => {
  const c = collector();
  const {context, page} = await fresh(c, {}, {width: 1280, height: 720});
  await page.goto(srv.origin + DASH);
  const order = [];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.tagName)); }
  assert.deepEqual(order.slice(0, 4), ['session', 'key', 'connect-btn', 'synthetic']);
  await context.close();
});
