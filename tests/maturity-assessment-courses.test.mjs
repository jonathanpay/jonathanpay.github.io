// Every course the assessment can suggest must exist in the email tools'
// course data, or its card silently disappears.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {COURSES} from '../email-tools/assets/course-ctas.js';

test('assessment course slugs exist in course-ctas.js', () => {
  const src = fs.readFileSync(new URL('../pilots/email-maturity-assessment/courses.js', import.meta.url), 'utf8');
  const table = src.slice(src.indexOf('export const BY_DIMENSION'), src.indexOf('export const band'));
  const slugs = [...table.matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]);
  assert.ok(slugs.length > 5);
  for (const slug of slugs) assert.ok(COURSES[slug], `${slug} is not in COURSES`);
  assert.equal((table.match(/foundation:/g) || []).length, 5);
});
