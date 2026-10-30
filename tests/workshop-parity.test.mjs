// T01/T02: the workshop copy matches the pilot's questionnaire and engine exactly, and nothing in the
// public workshop files can reach the pilot collector or carry a secret.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {root} from './workshop/harness.mjs';

const P = new URL('pilots/email-maturity-assessment/', root), W = new URL('workshops/london-forum/', root);
const read = (base, f) => fs.readFileSync(new URL(f, base));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
// SHA-256 of the handover pack's snapshots (inspected 30 Oct 2026, repo head 57b5797123520a9bf135d7fba2af99ac25ac1c69).
const PACK = {'data.js': 'c8888daae0b97c88406c99138d0508cc84288e68c3ba9d74c54c527ff0198b3c', 'engine.js': '7dc4c7b3b72fe2554e3178e3e01583574fefc1176d665687e47ad5fff71ca4f7'};

test('pinned copies are byte-identical to the pilot (and data/engine to the handover snapshots)', () => {
  for (const f of ['data.js', 'engine.js', 'advice.js', 'courses.js', 'styles.css', 'assets/hea-logo-icon.png']) {
    assert.ok(read(P, f).equals(read(new URL('email-maturity-assessment/', W), f)), f + ' drifted from the pilot; re-sync deliberately and re-run the parity tests');
  }
  for (const [f, h] of Object.entries(PACK)) assert.equal(sha(read(new URL('email-maturity-assessment/', W), f)), h, f);
});

test('questionnaire shape: 3 context, 17 diagnostics x 6 options, 9 obstacles, five dimensions and levels', async () => {
  const D = (await import('node:module')).createRequire(import.meta.url)(new URL('email-maturity-assessment/data.js', W).pathname);
  assert.equal(D.context.length, 3);
  assert.equal(D.questions.length, 17);
  assert.ok(D.questions.every((q, i) => q.id === 'Q' + (i + 1) && q.options.length === 6 && q.helper && /don’t know/.test(q.options[5])));
  assert.equal(D.obstacles.length, 9);
  assert.equal(D.dimensions.length, 5);
  assert.deepEqual(D.levels, ['Ad Hoc', 'Foundational', 'Strategic', 'Optimised', 'Innovative']);
});

test('public workshop files never name the pilot collector except as a refusal, and hold no secrets or contact capture', () => {
  const files = [];
  const walk = d => { for (const e of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : files.push(p); } };
  walk(new URL(W).pathname);
  for (const f of files.filter(f => /\.(js|html|css|gs|json)$/.test(f) && !f.endsWith('/engine.js'))) {
    const text = fs.readFileSync(f, 'utf8');
    const hits = text.match(/AKfycbyGg[A-Za-z0-9_-]*/g) || [];
    const ok = f.endsWith('email-maturity-assessment/app.js') || f.endsWith('dashboard/dashboard.js');
    assert.ok(ok || hits.length === 0, f + ' contains the pilot collector ID');
    if (ok) hits.forEach(h => assert.equal(h.length, 'AKfycbyGgFzMvzFunL9MXWww0rAq14PYqkbJ-6Xnc5DctBqLYxUCWRT1W0vadCzkZ0PoVCz3'.length));
    assert.ok(!text.includes('1gdTLFaaORQ') || f.endsWith('Code.gs') || f.endsWith('SETUP.md'), f + ' names the pilot sheet');
    assert.ok(!/FACILITATOR_KEY(?!_HASH)\s*[:=]\s*['"][0-9a-f]{20,}/i.test(text), f + ' looks like a key');
  }
  for (const f of ['email-maturity-assessment/config.js', 'dashboard/config.js']) assert.match(fs.readFileSync(new URL(f, W), 'utf8'), /collectorUrl:''/, f + ' ships with the collector empty');
  const app = fs.readFileSync(new URL('email-maturity-assessment/app.js', W), 'utf8');
  for (const bad of ['c-email', 'marketing', 'emailedTo', 'contact:', "mode:'no-cors'", 'no-cors', 'localStorage']) assert.ok(!app.includes(bad), 'app.js: ' + bad);
});

test('the pilot assessment is untouched by this change', () => {
  const cfg = fs.readFileSync(new URL('config.js', P), 'utf8');
  assert.match(cfg, /submitUrl:'https:\/\/script\.google\.com\/macros\/s\/AKfycbyGgFzMvzFunL9MXWww0rAq14PYqkbJ-6Xnc5DctBqLYxUCWRT1W0vadCzkZ0PoVCz3\/exec'/);
});
