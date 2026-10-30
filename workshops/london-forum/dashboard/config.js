// Public configuration for the facilitator dashboard. Nothing here is a secret and none of it grants access:
// the facilitator key is typed at run time, sent in the body of a POST, and checked by the collector.
//
// collectorUrl: the /exec URL of the WORKSHOP Apps Script deployment (same one as the assessment).
//   Empty means the dashboard cannot read anything. It is never the pilot's collector (dashboard.js refuses it).
// sessions: labels for the picker. The collector's answer is the authority for the label and environment shown.
window.HEA_DASHBOARD={
  collectorUrl:'',
  sessions:[
    {id:'lf-rehearsal',label:'London Forum workshop (rehearsal)'},
    {id:'lf-live-1',label:'London Forum workshop'}
  ]
};
