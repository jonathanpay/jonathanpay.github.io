#!/bin/sh
# Builds dist/hea-maturity-assessment.zip, the file to upload in WordPress
# (Plugins > Add New Plugin > Upload Plugin). Run the tests first:
#   node --test tests/maturity-assessment-*.test.mjs
set -e
cd "$(dirname "$0")"
mkdir -p dist
rm -f dist/hea-maturity-assessment.zip
zip -q -r -X dist/hea-maturity-assessment.zip hea-maturity-assessment -x '*.DS_Store'
echo "Built $(pwd)/dist/hea-maturity-assessment.zip"
