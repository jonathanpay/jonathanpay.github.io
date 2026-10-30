// Runs workshops/london-forum/apps-script/Code.gs against an in-memory
// spreadsheet. This is a SIMULATION of Google's services, not a deployment: it
// proves the script's logic, not Google quotas, locking latency or CORS.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
export const root = new URL('../../', import.meta.url);
export const E = require(new URL('pilots/email-maturity-assessment/engine.js', root).pathname);
export const D = require(new URL('pilots/email-maturity-assessment/data.js', root).pathname);
export const CODE = fs.readFileSync(new URL('workshops/london-forum/apps-script/Code.gs', root), 'utf8');
export const PILOT_SHEET_ID = '1gdTLFaaORQ_Z-_rgy1Lng6NBj4jB0hHGzkOK-54tSPc';
export const plain = v => JSON.parse(JSON.stringify(v));

function makeSheet(state, name) {
  const rows = state.sheets[name];
  let maxColumns = 200;
  return {
    getLastRow: () => rows.length,
    getLastColumn: () => Math.max(0, ...rows.map(r => r.length)),
    getMaxColumns: () => maxColumns,
    insertColumnsAfter: (_a, n) => { maxColumns += n; },
    setFrozenRows() {},
    getRange: (r, c, nr, nc) => {
      if (c - 1 + nc > maxColumns) throw new Error('Range out of bounds');
      return {
        setValues(v) { state.writes.push({sheet: name, row: r}); v.forEach((row, i) => { const t = rows[r - 1 + i] || (rows[r - 1 + i] = []); row.forEach((x, j) => { t[c - 1 + j] = x; }); }); return this; },
        getValues: () => Array.from({length: nr}, (_, i) => Array.from({length: nc}, (_, j) => (rows[r - 1 + i] || [])[c - 1 + j] ?? '')),
        setFontWeight() { return this; }
      };
    }
  };
}

// opts.contention: when true the lock stub throws on waitLock (simulates timeout).
export function load({properties = {}, sessions, contention = false} = {}) {
  const state = {sheets: {}, writes: [], fetches: [], mail: [], opened: [], props: {...properties}, locks: 0, maxHeld: 0, held: 0};
  const spreadsheets = {};
  const sheetFor = (id) => spreadsheets[id] || (spreadsheets[id] = {id, sheets: {}});
  const ctx = {
    SpreadsheetApp: {
      openById: id => {
        state.opened.push(id);
        const ss = sheetFor(id);
        return {
          getId: () => id, getName: () => 'Workshop test sheet',
          getSheetByName: n => { if (!ss.sheets[n]) return null; state.sheets = ss.sheets; return makeSheet(state, n); },
          insertSheet: n => { ss.sheets[n] = []; state.sheets = ss.sheets; return makeSheet(state, n); }
        };
      },
      getActiveSpreadsheet: () => ctx.__active,
      flush() {}
    },
    PropertiesService: {getScriptProperties: () => ({getProperty: k => state.props[k] ?? null, setProperty: (k, v) => { state.props[k] = String(v); }})},
    LockService: {getScriptLock: () => ({
      waitLock() { if (contention) throw new Error('Lock timeout'); state.locks++; state.held++; state.maxHeld = Math.max(state.maxHeld, state.held); },
      releaseLock() { state.held--; }
    })},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: s => ({body: s, setMimeType() { return JSON.parse(s); }})},
    Utilities: {
      computeDigest: (_alg, s) => [...crypto.createHash('sha256').update(String(s)).digest()].map(b => (b > 127 ? b - 256 : b)),
      DigestAlgorithm: {SHA_256: 'sha256'}, Charset: {UTF_8: 'utf8'},
      getUuid: () => crypto.randomUUID(), sleep() {}
    },
    Logger: {log: m => (state.log = (state.log || []).concat(m))},
    // Anything that could leave the script is a trap so a test notices.
    UrlFetchApp: {fetch: u => { state.fetches.push(u); throw new Error('UrlFetchApp must not be used'); }},
    MailApp: {sendEmail: o => { state.mail.push(o); throw new Error('MailApp must not be used'); }},
    GmailApp: {sendEmail: o => { state.mail.push(o); throw new Error('GmailApp must not be used'); }}
  };
  vm.createContext(ctx);
  vm.runInContext(CODE + '\nthis.HEADERS=HEADERS;this.COL=COL;this.group_=group_;this.aggregate_=aggregate_;this.calculate_=calculate_;this.CONTEXT_OPTION_COUNTS=CONTEXT_OPTION_COUNTS;this.DIMENSIONS=DIMENSIONS;this.OBSTACLES=OBSTACLES;this.QUESTIONS=QUESTIONS;this.LEVELS=LEVELS;', ctx);

  const api = {
    ctx, state,
    /** A configured workshop spreadsheet with the Sessions tab seeded. */
    configure(sheetId = 'WORKSHOP_TEST_SHEET') {
      ctx.__active = {getId: () => sheetId, getName: () => 'x', getSheetByName: n => null, insertSheet: n => null};
      state.props.SPREADSHEET_ID = sheetId;
      const ss = sheetFor(sheetId);
      ss.sheets.Responses = [ctx.HEADERS.slice()];
      ss.sheets.Sessions = [['Event ID', 'Session ID', 'Label', 'Environment', 'Status', 'Notes']].concat(sessions || [
        ['london-forum-2026', 'lf-rehearsal', 'London Forum workshop (rehearsal)', 'rehearsal', 'open', ''],
        ['london-forum-2026', 'lf-live-1', 'London Forum workshop', 'live', 'open', ''],
        ['london-forum-2026', 'lf-live-closed', 'Closed one', 'live', 'closed', '']
      ]);
      state.sheets = ss.sheets;
      return api;
    },
    setKey(key) { state.props.FACILITATOR_KEY_HASH = crypto.createHash('sha256').update(key).digest('hex'); return api; },
    post: obj => plain(ctx.doPost({postData: {contents: typeof obj === 'string' ? obj : JSON.stringify(obj)}})),
    get: params => plain(ctx.doGet({parameter: params})),
    responses: () => state.sheets.Responses,
    sheetFor
  };
  return api;
}

export const LETTER = s => (s === null ? 'UNKNOWN' : String.fromCharCode(64 + s));

/** A browser-shaped workshop record (what app.js posts). */
export function record(scores, extra = {}) {
  return {
    schema: 'hea-assessment-workshop-v1', questionnaireVersion: D.version, workshopBuildVersion: 'lf-test',
    eventId: 'london-forum-2026', sessionId: 'lf-rehearsal', responseId: 'HEA-TEST01', saveRevision: 1,
    startedAt: '2026-10-30T10:00:00.000Z', completedAt: '2026-10-30T10:12:30.000Z', questionnaireMilliseconds: 750000,
    context: D.context.map(q => ({id: q.id, option: 0, answer: q.options[0]})),
    answers: D.questions.map((q, i) => ({id: q.id, answerId: q.id + '.' + LETTER(scores[i]), score: scores[i], answer: 'x'})),
    timingsMilliseconds: {Q1: 1000}, result: {level: 5}, p1: {area: null, obstacle: null, status: 'not-answered'}, feedback: '', ...extra
  };
}
