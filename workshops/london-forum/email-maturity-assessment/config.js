// Public configuration for the London Forum workshop assessment. Nothing here is a secret.
//
// collectorUrl: the /exec URL of the WORKSHOP Apps Script deployment (workshops/london-forum/apps-script).
//   Leave empty until that deployment exists: submissions stay switched off and the page says so.
//   It is never the pilot's collector; app.js refuses that one by ID. The URL is not an access control.
// eventId: must match the "Event ID" column of the workshop spreadsheet's Sessions tab.
// privacyUrl / retentionNotice: leave empty until Jon has confirmed what they should say.
//
// The session comes from the link: .../email-maturity-assessment/?session=lf-live-1
window.HEA_WORKSHOP={
  collectorUrl:'',
  eventId:'london-forum-2026',
  buildVersion:'lf-workshop-01',
  privacyUrl:'',
  retentionNotice:''
};
