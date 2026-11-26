#!/usr/bin/env node
// Sends a range of SYNTHETIC responses to the REHEARSAL session through the workshop collector, so the
// dashboard can be rehearsed. Run it from your own machine (Node 22+, no install needed):
//
//   node workshops/london-forum/tools/seed-rehearsal.mjs --dry-run      # show what would be sent
//   node workshops/london-forum/tools/seed-rehearsal.mjs                # send 30 records
//   node workshops/london-forum/tools/seed-rehearsal.mjs --count 60 --batch B
//
// Safety: it asks the collector about the session first and stops unless that session is a *rehearsal*
// that is *open*. It never sends to the pilot collector. It sends the same record shape the page sends
// (so the collector validates and scores it exactly as for a person), one at a time.
// Records use IDs HEA-SYN<batch><nnnn>. Re-running the same batch rewrites the same rows (no duplicates);
// use a new --batch letter for extra rows. To remove them, set Excluded in the sheet or filter on "SYN".
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const base = new URL('../email-maturity-assessment/', import.meta.url);
const D = require(fileURLToPath(new URL('data.js', base)));
const E = require(fileURLToPath(new URL('engine.js', base)));
const PILOT_ID = 'AKfycbyGgFzMvzFunL9MXWww0rAq14PYqkbJ-6Xnc5DctBqLYxUCWRT1W0vadCzkZ0PoVCz3';
const N = null; // "I don't know"

// Each archetype is a full set of Q1-Q17 answers (1-5, or null for unknown). Areas: Q1-3, Q4-7, Q8-11, Q12-14, Q15-17.
const FIXED = [
  ['Everything Ad Hoc', Array(17).fill(1)],
  ['Everything Foundational', Array(17).fill(2)],
  ['Everything Strategic', Array(17).fill(3)],
  ['Everything Optimised', Array(17).fill(4)],
  ['Everything Innovative', Array(17).fill(5)],
  ['Strong, Strategy & Governance lowest', [2, 2, 2, ...Array(14).fill(4)]],
  ['Strong, Deliverability lowest', [4, 4, 4, 2, 2, 2, 2, ...Array(10).fill(4)]],
  ['Strong, Customer Experience lowest', [...Array(7).fill(4), 2, 2, 2, 2, ...Array(6).fill(4)]],
  ['Strong, Testing & Learning lowest', [...Array(11).fill(4), 2, 2, 2, 4, 4, 4]],
  ['Strong, Personalisation lowest', [...Array(14).fill(4), 2, 2, 2]],
  ['Tie: Deliverability and Testing lowest', [4, 4, 4, 2, 2, 2, 2, 4, 4, 4, 4, 2, 2, 2, 4, 4, 4]],
  ['Three-way tie at Strategic', [3, 3, 3, 5, 5, 5, 5, 3, 3, 3, 3, 5, 5, 5, 3, 3, 3]],
  ['Exact-half boundaries', [5, 5, 5, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5]],
  ['Ceiling creates a tie', [1, 5, 5, 2, 2, 2, 3, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
  ['Typical mixed 1', [3, 3, 2, 4, 3, 3, 2, 3, 4, 3, 2, 3, 2, 3, 4, 3, 3]],
  ['Typical mixed 2', [4, 4, 3, 3, 4, 4, 3, 2, 3, 3, 3, 4, 3, 3, 4, 4, 3]],
  ['Typical mixed 3', [2, 2, 3, 3, 2, 2, 3, 3, 3, 4, 3, 2, 3, 2, 3, 2, 3]],
  ['Advanced programme', [5, 4, 4, 4, 4, 5, 4, 4, 5, 4, 4, 4, 4, 5, 4, 4, 4]],
  ['Partial, level confirmed (one area unknown)', [2, 2, 2, N, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
  ['Partial, one known weak area, rest unknown', [1, 1, 1, ...Array(14).fill(N)]],
  ['Range: Strategy unknown', [N, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
  ['Range: whole area unknown', [N, N, N, 2, 2, 2, 2, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
  ['Partial: Personalisation unknown', [2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, N, 4, 4]],
  ['All unknown', Array(17).fill(N)],
  ['Unknown-heavy', [3, N, 3, N, 4, 4, N, 3, N, 3, 3, 4, N, 3, 3, N, 4]],
  ['One unknown, rest Optimised', [4, N, 4, ...Array(14).fill(4)]]
];

// Deterministic extra profiles for volume (a fixed LCG, so the same batch always means the same data).
function extra(i) {
  let s = 1000 + i * 7919;
  const rand = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const base = 1 + Math.floor(rand() * 5);
  return ['Varied profile', Array.from({length: 17}, () => (rand() < 0.1 ? N : Math.max(1, Math.min(5, base + Math.round((rand() - 0.5) * 3)))))];
}

const letter = s => (s === null ? 'UNKNOWN' : String.fromCharCode(64 + s));

export function buildRecords({count = 30, batch = 'A', eventId = 'london-forum-2026', sessionId = 'lf-rehearsal', buildVersion = 'lf-seed'} = {}) {
  if (!/^[A-Z]$/.test(batch)) throw new Error('--batch must be a single capital letter');
  return Array.from({length: count}, (_, i) => {
    const [label, scores] = i < FIXED.length ? FIXED[i] : extra(i);
    // Spread P1 over every obstacle, then skipped and not answered; vary the context answers too.
    const p = i % 12;
    const p1 = p <= 8 ? {status: 'answered', obstacle: p, area: i % 3 === 0 ? 'several' : i % 5}
      : p === 9 || p === 10 ? {status: 'skipped', obstacle: null, area: null}
        : {status: 'not-answered', obstacle: null, area: null};
    const t = Date.parse('2026-10-30T10:00:00Z') + i * 61000;
    return {
      label,
      record: {
        schema: 'hea-assessment-workshop-v1', questionnaireVersion: D.version, prototypeVersion: D.prototypeVersion,
        workshopBuildVersion: buildVersion, eventId, sessionId, responseId: `HEA-SYN${batch}${String(i + 1).padStart(4, '0')}`, pilotCode: `HEA-SYN${batch}${String(i + 1).padStart(4, '0')}`,
        saveRevision: 1, startedAt: new Date(t).toISOString(), completedAt: new Date(t + (12 + (i % 9)) * 60000).toISOString(),
        questionnaireMilliseconds: (12 + (i % 9)) * 60000,
        context: D.context.map((q, k) => ({id: q.id, option: (i + k * 3) % q.options.length, answer: ''})),
        answers: D.questions.map((q, k) => ({id: q.id, answerId: q.id + '.' + letter(scores[k]), score: scores[k], answer: ''})),
        timingsMilliseconds: {}, p1, feedback: 'Synthetic rehearsal record'
      },
      scores
    };
  });
}

// What a correct dashboard should show for these records (computed with the same engine as the page).
export function expected(items) {
  const res = items.map(x => E.calculate(x.scores));
  const count = f => res.filter(f).length;
  const out = {submitted: items.length, states: {}, areas: D.dimensions.map(() => ({})), limiting: D.dimensions.map(() => 0), complete: count(r => r.state === 'complete')};
  res.forEach(r => {
    out.states[r.state] = (out.states[r.state] || 0) + 1;
    r.dimensions.forEach((d, i) => { const k = d.complete ? D.levels[d.score.level - 1] : 'Unconfirmed'; out.areas[i][k] = (out.areas[i][k] || 0) + 1; });
    r.constraints.forEach(i => { out.limiting[i]++; });
  });
  return out;
}

const args = (() => { const a = {}; const v = process.argv.slice(2); for (let i = 0; i < v.length; i++) { if (v[i] === '--dry-run') a.dry = true; else if (v[i].startsWith('--')) a[v[i].slice(2)] = v[++i]; } return a; })();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const cfg = fs.readFileSync(fileURLToPath(new URL('config.js', base)), 'utf8');
  const url = args.url || (cfg.match(/collectorUrl:'([^']*)'/) || [])[1] || '';
  const eventId = args.event || (cfg.match(/eventId:'([^']*)'/) || [])[1];
  const sessionId = args.session || 'lf-rehearsal';
  const count = Number(args.count || 30);
  if (!Number.isInteger(count) || count < 1 || count > 200) throw new Error('--count must be 1-200');
  const items = buildRecords({count, batch: args.batch || 'A', eventId, sessionId});
  const exp = expected(items);
  console.log(`Prepared ${items.length} synthetic records for session "${sessionId}" (${D.version}).`);
  console.log('Expected on the dashboard (once all are in, on an otherwise empty session):');
  console.log('  Result states:', JSON.stringify(exp.states));
  D.dimensions.forEach((d, i) => console.log(`  ${d}: ${JSON.stringify(exp.areas[i])}  lowest-area count (of ${exp.complete} complete): ${exp.limiting[i]}`));
  console.log('  Small cells (under 3) will be pooled on screen, so compare totals and the larger cells.');
  if (args.dry) { console.log('\nDry run: nothing sent.'); return; }
  if (!url || url.includes(PILOT_ID)) throw new Error('No workshop collector URL (set it in config.js or pass --url). Never the pilot collector.');
  const info = await (await fetch(`${url}?action=session&session=${encodeURIComponent(sessionId)}`)).json();
  if (!info.ok) throw new Error(`Collector says: ${info.code || ''} ${info.error || ''}`);
  if (info.session.environment !== 'rehearsal') throw new Error(`Refusing: "${sessionId}" is a ${info.session.environment} session. This script only seeds rehearsal sessions.`);
  if (info.session.status !== 'open') throw new Error(`Session "${sessionId}" is ${info.session.status}. Set it to open in the Sessions tab first.`);
  console.log(`\nSending to: ${info.session.label} (${info.session.environment}, ${info.session.status})`);
  let ok = 0, failed = 0;
  for (const [i, {label, record}] of items.entries()) {
    let reply = null;
    for (let attempt = 0; attempt < 4 && !(reply && reply.saved); attempt++) {
      if (attempt) await sleep(1500 * attempt);
      try { reply = await (await fetch(url, {method: 'POST', body: JSON.stringify(record)})).json(); } catch (e) { reply = {ok: false, error: String(e.message || e)}; }
      if (reply && !reply.ok && reply.code && reply.code !== 'busy') break; // a rejection will not improve on retry
    }
    if (reply && reply.saved) { ok++; console.log(`  ${String(i + 1).padStart(3)}  saved   ${record.responseId}  ${label}`); }
    else { failed++; console.log(`  ${String(i + 1).padStart(3)}  FAILED  ${record.responseId}  ${label}: ${reply && (reply.code || reply.error)}`); }
    await sleep(250);
  }
  console.log(`\nDone: ${ok} saved, ${failed} failed. Open the dashboard for ${sessionId}, connect, and Refresh.`);
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(e => { console.error('Stopped: ' + e.message); process.exit(1); });
