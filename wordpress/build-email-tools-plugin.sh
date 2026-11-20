#!/bin/sh
# Builds dist/hea-email-tools.zip, the file to upload in WordPress
# (Plugins > Add New Plugin > Upload Plugin). Regenerates the plugin's
# assets and templates from email-tools/ and runs the tests first.
set -e
cd "$(dirname "$0")/.."
node --test tests/stats.test.mjs tests/hypothesis.test.mjs tests/sscc-verdicts.test.mjs \
  tests/course-context.test.mjs tests/course-ctas.test.mjs tests/curve.test.mjs \
  tests/dominance-scorer.test.mjs tests/readability.test.mjs tests/pronouns.test.mjs \
  tests/f2b.test.mjs tests/personalisation.test.mjs tests/contrast.test.mjs \
  tests/dmarc-rules.test.mjs tests/site.test.mjs
node wordpress/build-email-tools.mjs
node --test tests/email-tools-plugin.test.mjs
cd wordpress
mkdir -p dist
rm -f dist/hea-email-tools.zip
zip -q -r -X dist/hea-email-tools.zip hea-email-tools -x '*.DS_Store'
echo "Built $(pwd)/dist/hea-email-tools.zip"
