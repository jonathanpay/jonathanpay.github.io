// Public configuration for the London Forum workshop assessment. Nothing here is a secret.
//
// collectorUrl: the /exec URL of the WORKSHOP Apps Script deployment (workshops/london-forum/apps-script).
//   Empty switches submissions off and the page says so. Both URL forms are accepted:
//   /macros/s/<id>/exec and the Workspace form /a/macros/<domain>/s/<id>/exec.
//   It is never the pilot's collector; app.js refuses that one by ID. The URL is not an access control.
// eventId: must match the "Event ID" column of the workshop spreadsheet's Sessions tab.
// privacyUrl / retentionNotice: leave empty until Jon has confirmed what they should say.
//
// The session comes from the link: .../email-maturity-assessment/?session=lf-live-1
window.HEA_WORKSHOP={
  collectorUrl:'https://script.google.com/a/macros/holisticemail.academy/s/AKfycby3D4ySsDNcr1P8rwnYNFROsAC8KB-6k-ZJgPuvltIcbj96BQ-oxVUtDQcYpzObsa3WdA/exec',
  eventId:'london-forum-2026',
  buildVersion:'lf-workshop-01',
  privacyUrl:'',
  retentionNotice:''
};
