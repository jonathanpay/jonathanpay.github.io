// Runs maturity-assessment-collector.test.mjs against the Academy (WordPress) copy
// of the assessment and its collector script.
process.env.HEA_MA_DIR = '../wordpress/hea-maturity-assessment/assets/js/';
process.env.HEA_MA_COLLECTOR = '../wordpress/apps-script/Code.gs';
await import('./maturity-assessment-collector.test.mjs');
