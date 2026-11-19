// The Academy (WordPress plugin) copy of the maturity assessment.
// Scoring, advice and the collector are covered by the shared suites
// (maturity-assessment-academy-*.test.mjs); this file checks what is
// specific to the WordPress copy.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {COURSES as SITE_COURSES} from '../email-tools/assets/course-ctas.js';

const require = createRequire(import.meta.url);
const pilot = new URL('../pilots/email-maturity-assessment/', import.meta.url);
const plugin = new URL('../wordpress/hea-maturity-assessment/', import.meta.url);
const js = new URL('assets/js/', plugin);
const read = url => fs.readFileSync(url, 'utf8');

test('scoring and advice are the pilot files, unchanged', () => {
  assert.equal(read(new URL('engine.js', js)), read(new URL('engine.js', pilot)));
  assert.equal(read(new URL('advice.js', js)), read(new URL('advice.js', pilot)));
  const strip = s => s.replace(/"prototypeVersion": "[^"]*"/, '');
  assert.equal(strip(read(new URL('data.js', js))), strip(read(new URL('data.js', pilot))));
  assert.equal(require(new URL('data.js', js).pathname).prototypeVersion, 'academy-01');
});

test('course data matches the email tools and links stay on the site without UTM tags', () => {
  const C = require(new URL('courses.js', js).pathname);
  for (const [slug, c] of Object.entries(C.COURSES)) {
    const site = SITE_COURSES[slug];
    assert.ok(site, `${slug} is not in email-tools course-ctas.js`);
    assert.deepEqual({title: c.title, level: c.level, status: c.status, offer: c.offer},
      {title: site.title, level: site.level, status: site.status, offer: site.offer}, slug);
  }
  const slugs = C.BY_DIMENSION.flatMap(d => [...d.foundation, ...d.intermediate, ...d.advanced]);
  assert.equal(C.BY_DIMENSION.length, 5);
  for (const slug of slugs) assert.ok(C.COURSES[slug], `${slug} missing from COURSES`);

  const all = [0, 1, 2, 3, 4].flatMap(dimension => [1, 3, 5].flatMap(level => C.suggest([{dimension, level, confirmed: true}], 9)));
  assert.ok(all.length > 5);
  for (const c of all) {
    assert.match(c.url, /^\/courses\/[a-z0-9-]+\/\?ref=maturity-assessment-dimension-[1-5]$/);
    assert.doesNotMatch(c.url, /utm_/);
  }
  assert.doesNotMatch(C.ALL_COURSES_URL, /utm_/);
  // Up to three suggestions, no repeats.
  const many = C.suggest([0, 1, 2, 3, 4].map(dimension => ({dimension, level: 1, confirmed: true})));
  assert.equal(many.length, 3);
  assert.equal(new Set(many.map(c => c.slug)).size, 3);
});

test('no pilot or workshop wording reaches people taking the assessment', () => {
  const app = read(new URL('app.js', js));
  // Text people see sits in template literals and quoted strings; internal
  // field names (schema, pilotCode) are not shown and stay for compatibility.
  const visible = [...app.matchAll(/`[^`]*`|'[^'\n]*'/g)].map(m => m[0])
    .filter(s => !/^'hea-assessment-pilot-v1'$|^'HEA-/.test(s)).join('\n');
  for (const word of [/pilot/i, /test record/i, /facilitator/i, /debrief/i, /Review 04/i, /London/i, /workshop/i, /Questionnaire time/]) {
    assert.doesNotMatch(visible, word, String(word));
  }
  assert.doesNotMatch(app, /Your programme profile · \$\{/, 'reference code is not in the result heading');
  assert.doesNotMatch(app, /jonathanpay|github/i);
});

test('the plugin prints the containers app.js and the stylesheet expect', () => {
  const php = read(new URL('hea-maturity-assessment.php', plugin));
  const app = read(new URL('app.js', js));
  assert.match(php, /add_shortcode\( 'hea_maturity_assessment'/);
  assert.match(php, /<div id="hea-ma" class="hea-ma"><div id="hea-ma-app" class="hea-ma-app">/);
  assert.match(app, /getElementById\('hea-ma-app'\)/);
  assert.match(app, /getElementById\('hea-ma'\)/);
  for (const f of ['assets/assessment.css', 'assets/fonts/CMGSans-Regular.ttf', 'assets/fonts/CMGSans-SemiBold.ttf',
    'assets/js/data.js', 'assets/js/engine.js', 'assets/js/advice.js', 'assets/js/courses.js', 'assets/js/app.js']) {
    assert.ok(fs.existsSync(new URL(f, plugin)), f);
    if (f.endsWith('.js') || f.endsWith('.css')) assert.ok(php.includes(f.replace('assets/', '')), `${f} is loaded by the plugin`);
  }
});

test('every stylesheet rule is scoped to the assessment and braces balance', () => {
  const css = read(new URL('assets/assessment.css', plugin)).replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0, prelude = '';
  const selectors = [];
  for (const ch of css) {
    if (ch === '{') {
      const p = prelude.trim();
      if (!p.startsWith('@')) selectors.push(p);
      depth++; prelude = '';
    } else if (ch === '}') {
      depth--; prelude = '';
      assert.ok(depth >= 0, 'stray closing brace');
    } else if (ch === ';') {
      prelude = '';
    } else {
      prelude += ch;
    }
  }
  assert.equal(depth, 0, 'unclosed brace');
  assert.ok(selectors.length > 100);
  for (const list of selectors) {
    if (list === '') continue; // @font-face body
    for (const sel of list.split(',').map(s => s.trim())) {
      assert.ok(sel.startsWith('#hea-ma') || sel === '.hea-ma-print-hide', `unscoped selector: ${sel}`);
    }
  }
});
