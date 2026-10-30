// Browser helpers: a static server for the repo, and a route that plays the workshop Apps Script
// (Code.gs, run in-process by harness.mjs) so pages talk to the real collector logic without Google.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root} from './harness.mjs';

const require = createRequire(import.meta.url);
export const {chromium} = require('playwright');
export const COLLECTOR_URL = 'https://script.google.com/macros/s/WORKSHOP_TEST_DEPLOYMENT_0001/exec';
export const PILOT_URL = 'https://script.google.com/macros/s/AKfycbyGgFzMvzFunL9MXWww0rAq14PYqkbJ-6Xnc5DctBqLYxUCWRT1W0vadCzkZ0PoVCz3/exec';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf'};

export function serve() {
  const base = new URL(root).pathname;
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(base, p);
    if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({server, origin: 'http://127.0.0.1:' + server.address().port})));
}

const cors = {'access-control-allow-origin': '*', 'content-type': 'application/json'};

/**
 * Wires a page: config.js overrides, the workshop collector route, and a request log.
 * hooks.beforePost(body, n) may return {fail:true}|{delay:ms}|{raw:string} to simulate trouble.
 */
export async function wire(context, c, {collectorUrl = COLLECTOR_URL, dashboard = false, sessions, hooks = {}} = {}) {
  const log = {posts: [], gets: [], external: [], bodies: []};
  await context.route('**/workshops/london-forum/email-maturity-assessment/config.js', r => r.fulfill({contentType: 'text/javascript',
    body: `window.HEA_WORKSHOP=${JSON.stringify({collectorUrl, eventId: 'london-forum-2026', buildVersion: 'lf-test', privacyUrl: '', retentionNotice: ''})};`}));
  await context.route('**/workshops/london-forum/dashboard/config.js', r => r.fulfill({contentType: 'text/javascript',
    body: `window.HEA_DASHBOARD=${JSON.stringify({collectorUrl, sessions: sessions || [{id: 'lf-rehearsal', label: 'London Forum workshop (rehearsal)'}, {id: 'lf-live-1', label: 'London Forum workshop'}]})};`}));
  await context.route(/^https:\/\/script\.google\.com\//, async route => {
    const req = route.request();
    log.external.push(req.url());
    if (req.url().startsWith(collectorUrl.replace(/\/exec$/, '')) && !req.url().includes('AKfycbyGg') && c) {
      if (req.method() === 'POST') {
        const body = req.postData() || '';
        log.posts.push(body); log.bodies.push(body);
        const h = hooks.beforePost ? await hooks.beforePost(body, log.posts.length) : null;
        if (h && h.delay) await new Promise(r => setTimeout(r, h.delay));
        if (h && h.fail) return route.abort('failed');
        if (h && h.raw !== undefined) return route.fulfill({status: 200, headers: cors, body: h.raw});
        return route.fulfill({status: 200, headers: cors, body: JSON.stringify(c.post(body))});
      }
      log.gets.push(req.url());
      const u = new URL(req.url());
      return route.fulfill({status: 200, headers: cors, body: JSON.stringify(c.get(Object.fromEntries(u.searchParams)))});
    }
    return route.abort('failed'); // any other Google URL (including the pilot's) is unreachable AND logged
  });
  return log;
}

/** Answer the whole questionnaire. opts: 0-4 = options A-E, 5 = I don't know. */
export async function complete(page, picks, ctx = [0, 1, 2]) {
  await page.click('#begin');
  for (const i of ctx) { await page.locator('label.option').nth(i).click(); await page.click('#next'); }
  for (const i of picks) { await page.locator('label.option').nth(i).click(); await page.click('#next'); }
}
