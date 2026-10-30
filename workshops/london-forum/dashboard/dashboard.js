(function(){
'use strict';
// Facilitator dashboard. It only ever receives the collector's aggregate payload for one session; there is no
// raw-row path in this file. Access is enforced by the collector, which checks the facilitator key sent in the
// POST body. Nothing here is a control: hiding a button or a URL would not protect any data.
const C=window.HEA_DASHBOARD||{};
const PILOT_COLLECTOR_ID='AKfycbyGgFzMvzFunL9MXWww0rAq14PYqkbJ-6Xnc5DctBqLYxUCWRT1W0vadCzkZ0PoVCz3';
const collectorUrl=(u=>/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(u)&&!u.includes(PILOT_COLLECTOR_ID)?u:'')(String(C.collectorUrl||'').trim());
const TIMEOUT=30000,KEY_STORE='hea-lf-dashboard-key';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LEVELS=['Ad Hoc','Foundational','Strategic','Optimised','Innovative'];
const COLS=[...LEVELS.map((l,i)=>({key:'L'+(i+1),label:l})),{key:'unconfirmed',label:'Unconfirmed'}];
const MARKS=['†','‡','§','¶','#'];

// Labelled teaching example (workshop script, backup slide 13). Not this room's data.
const SYNTHETIC={submitted:10,synthetic:true,areas:[
 ['Strategy & Governance',[2,2,3,1,0,2]],['Deliverability & Infrastructure',[1,2,3,1,1,2]],['Customer Experience & Psychology',[1,3,3,1,0,2]],['Testing & Learning',[3,3,1,1,0,2]],['Personalisation & Lifecycle',[2,3,2,1,0,2]]
].map(([name,c],index)=>({index,name,denominator:10,groups:c.map((count,i)=>({keys:[COLS[i].key],labels:[COLS[i].label],count,pooled:false}))}))};

const st={session:'',key:'',snapshot:null,shownAt:null,error:null,frozen:false,loading:false,synthetic:false,controlsHidden:false,connected:false,envelope:null};

// ---- Collector call ----------------------------------------------------------------
async function fetchAggregate(){
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),TIMEOUT);
 try{
  // Body only: the key is never in the address, and a plain-text body avoids a CORS preflight Apps Script cannot answer.
  const res=await fetch(collectorUrl,{method:'POST',body:JSON.stringify({action:'aggregate',session:st.session,key:st.key}),signal:ctl.signal});
  let r;try{r=await res.json();}catch(e){throw new Error('bad-reply');}
  if(!r||r.ok!==true){const e=new Error((r&&r.code)||'bad-reply');e.code=r&&r.code;throw e;}
  if(r.schema!=='hea-workshop-aggregate-v1'||!r.session||r.session.id!==st.session||!r.snapshot||!r.data)throw new Error('bad-reply');
  return r;
 }finally{clearTimeout(t);}
}
const ERRORS={
 unauthorised:'The collector did not accept that facilitator key.',
 'unknown-session':'The collector does not recognise that session.',
 'not-configured':'The collector is not set up yet.',
 'bad-reply':'The collector sent a reply this page could not read.'
};
async function refresh(){
 if(st.loading||st.frozen||!st.connected)return;
 st.loading=true;render();
 try{
  const r=await fetchAggregate();
  st.envelope=r;st.snapshot=r.data;st.shownAt=new Date(r.snapshot.at);st.error=null;
 }catch(e){
  // Keep the last good snapshot and its original time; only say that this refresh failed.
  const name=e&&e.name==='AbortError'?'The collector took too long to answer.':ERRORS[e&&e.message]||'Could not reach the collector.';
  st.error={text:name,at:new Date(),code:e&&e.code||null};
  if(st.error.code==='unauthorised'&&!st.snapshot)st.connected=false;
 }
 st.loading=false;render();
}
async function connect(e){
 e&&e.preventDefault();
 st.session=$('session').value;st.key=$('key').value.trim();
 if(!collectorUrl){st.error={text:'The dashboard is not connected to a collector yet.',at:new Date()};render();return;}
 if(!st.session||st.key.length<32){st.error={text:!st.session?'Choose a session first.':'Enter the facilitator key.',at:new Date()};render();return;}
 st.connected=true;st.snapshot=null;st.envelope=null;st.shownAt=null;st.frozen=false;st.synthetic=false;st.error=null;
 try{sessionStorage.setItem(KEY_STORE,st.key);}catch(e){}
 $('key').value='';
 await refresh();
}
function disconnect(){
 st.connected=false;st.snapshot=null;st.envelope=null;st.shownAt=null;st.key='';st.frozen=false;st.error=null;
 try{sessionStorage.removeItem(KEY_STORE);}catch(e){}
 render();
}
function toggleFreeze(){if(!st.connected)return;st.frozen=!st.frozen;if(!st.frozen)refresh();else render();}
function toggleSynthetic(){st.synthetic=!st.synthetic;render();}
function toggleControls(){st.controlsHidden=!st.controlsHidden;render();}

// ---- Rendering ------------------------------------------------------------------------
const fmt=d=>d?d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'–';
function age(d){if(!d)return '';const m=Math.floor((Date.now()-d.getTime())/60000);return m<1?'just now':m===1?'1 minute ago':m+' minutes ago';}

// A group's cells for a fixed column order; pooled groups carry a mark and a footnote.
function matrixRow(area){
 const byKey={};area.groups.forEach((g,gi)=>g.keys.forEach(k=>{byKey[k]={g,gi};}));
 const marks={},notes=[];let m=0;
 area.groups.forEach(g=>{if(g.pooled){marks[g.keys.join()]=MARKS[m++%MARKS.length];notes.push(`${marks[g.keys.join()]} ${g.labels.join(' + ')}: ${g.count} together`);}});
 const N=area.denominator||1;
 let cells='';
 for(let i=0;i<COLS.length;i++){
  const c=COLS[i],x=byKey[c.key];
  if(!x){cells+='<td class="na">–</td>';continue;}
  if(x.g.pooled){
   let span=1;while(i+span<COLS.length&&byKey[COLS[i+span].key]&&byKey[COLS[i+span].key].g===x.g)span++;
   cells+=`<td class="pooled" colspan="${span}" title="Pooled: each of these is too small to show on its own"><span class="n">pooled ${marks[x.g.keys.join()]}</span></td>`;i+=span-1;continue;
  }
  const pct=Math.round(100*x.g.count/N);
  cells+=`<td class="${c.key==='unconfirmed'?'unc':''}"><span class="n">${x.g.count}</span><span class="bar" style="width:${pct}%"></span></td>`;
 }
 return `<tr><th scope="row">${esc(area.name)}</th>${cells}</tr>${notes.length?`<tr class="note-row"><td colspan="7">${notes.map(esc).join(' · ')}</td></tr>`:''}`;
}
function areasHtml(d){
 return `<section class="card areas" aria-labelledby="h-areas"><h2 id="h-areas">Five areas: where reported practice sits</h2><p class="sub">Number of submitted assessments at each level, per area. Each row adds up to ${d.submitted}. Unconfirmed is shown separately.</p><div class="scroll"><table class="matrix"><thead><tr><th scope="col">Area</th>${COLS.map(c=>`<th scope="col" class="${c.key==='unconfirmed'?'unc':''}">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${d.areas.map(matrixRow).join('')}</tbody></table></div></section>`;
}
function groupBars(groups,total,cls){
 return `<ul class="bars ${cls||''}">${groups.map(g=>{
  const label=g.pooled?(g.labels.length>3?g.labels.length+' categories':g.labels.join(' + '))+' (pooled)':g.labels[0];
  return `<li><span class="lab">${esc(label)}</span><span class="track"><span class="fill${g.pooled?' hatch':''}" style="width:${Math.round(100*g.count/(total||1))}%"></span></span><span class="val">${g.count}</span></li>`;}).join('')}</ul>`;
}
function statesHtml(d){
 return `<section class="card" aria-labelledby="h-states"><h2 id="h-states">How certain are the results?</h2><p class="sub">Of ${d.resultStates.denominator} submitted assessments:</p>${groupBars(d.resultStates.groups,d.resultStates.denominator)}<p class="fine">Complete: every area confirmed. Partial: some answers were “I don’t know”. A partial profile does not show a definite limiting area.</p></section>`;
}
function limitingHtml(d){
 const l=d.limiting;
 if(l.withheld)return `<section class="card" aria-labelledby="h-lim"><h2 id="h-lim">Lowest area (complete profiles)</h2><p class="withheld">Not shown: there are not enough complete profiles to show this view safely.</p></section>`;
 return `<section class="card" aria-labelledby="h-lim"><h2 id="h-lim">Lowest area (complete profiles)</h2><p class="sub">Of ${l.denominator} complete profiles, how many have each area at the lowest level. Ties count in every tied area, so the bars can add up to more than ${l.denominator}.</p><ul class="bars">${l.areas.map(a=>`<li><span class="lab">${esc(a.name)}</span><span class="track"><span class="fill" style="width:${a.suppressed||!a.count?0:Math.round(100*a.count/l.denominator)}%"></span></span><span class="val">${a.suppressed?'under '+(st.envelope&&st.envelope.policy?st.envelope.policy.minCell:3):a.count}</span></li>`).join('')}</ul></section>`;
}
function obstaclesHtml(d){
 const s=d.obstacleStatus,o=d.obstacles;
 const stat=s.groups.map(g=>`${esc(g.labels.join(' + '))}${g.pooled?' (pooled)':''}: ${g.count}`).join(' · ');
 return `<section class="card obs" aria-labelledby="h-obs"><h2 id="h-obs">Optional: what makes progress difficult?</h2><p class="sub">Answered after the result, so counts can rise. Of ${s.denominator} submitted assessments: ${stat}.</p>${o.withheld?'<p class="withheld">Not shown: too few people have answered to show this safely.</p>':`<p class="sub">Among the ${o.denominator} who answered:</p>${groupBars(o.groups,o.denominator,'obs')}`}</section>`;
}
function boardHtml(d){
 if(d.status==='empty')return '<div class="empty"><h2>No submitted assessments yet</h2><p>This is not a result. Refresh once people have finished.</p></div>';
 if(d.status==='below-threshold'){
  const need=st.envelope&&st.envelope.policy?st.envelope.policy.minProfiles:5;
  return `<div class="empty"><h2>${d.submitted} submitted so far</h2><p>The room view appears when at least ${need} assessments are in, so that no individual’s answers can be picked out. Nothing is hidden behind this screen: the collector has not sent a breakdown.</p><p>Use the synthetic example to practise the questions meanwhile.</p></div>`;
 }
 return `<div class="grid">${areasHtml(d)}${statesHtml(d)}${limitingHtml(d)}${obstaclesHtml(d)}</div>`;
}
function syntheticHtml(){return `<div class="grid synth">${areasHtml(SYNTHETIC)}<section class="card prompts"><h2>Questions for the room</h2><ul><li>Where do reported practices differ?</li><li>Where is visibility limited?</li><li>What could explain the pattern?</li><li>What would you check first?</li></ul></section></div>`;}

function render(){
 const sel=$('session');
 document.body.classList.toggle('controls-hidden',st.controlsHidden);
 $('hide').textContent='';$('hide').append(st.controlsHidden?'Show controls ':'Hide controls ');const k=document.createElement('kbd');k.textContent='H';$('hide').append(k);
 $('refresh').disabled=!st.connected||st.frozen||st.loading;
 $('freeze').disabled=!st.connected;$('freeze').setAttribute('aria-pressed',String(st.frozen));
 $('freeze').firstChild.textContent=st.frozen?'Unfreeze ':'Freeze ';
 $('disconnect').disabled=!st.connected;
 $('synthetic').setAttribute('aria-pressed',String(st.synthetic));
 $('connect-btn').disabled=st.loading;
 const env=st.envelope,sess=env&&env.session;
 $('title').innerHTML=sess?`${esc(sess.label)} <span class="env ${sess.environment}">${sess.environment==='live'?'Live':'Rehearsal'}</span>`:'Room patterns';
 const d=st.synthetic?SYNTHETIC:st.snapshot;
 $('count').textContent=st.synthetic?'10 (synthetic)':st.snapshot?String(st.snapshot.submitted):'–';
 $('snapshot').innerHTML=st.synthetic?'Not live data':st.shownAt?`${fmt(st.shownAt)} <span class="age">${esc(age(st.shownAt))}</span>`:'–';
 $('mode').textContent=st.synthetic?'Synthetic example':!st.connected?'Not connected':st.loading?'Refreshing…':st.frozen?'Frozen':st.error&&st.snapshot?'Stale':st.snapshot?'Snapshot':'Waiting';
 $('mode').className=st.synthetic?'m-synth':st.frozen?'m-frozen':st.error&&st.snapshot?'m-stale':'';
 const b=$('banner');let msg='',cls='';
 if(st.synthetic){msg='SYNTHETIC EXAMPLE: teaching data for practice. This is not this room’s result, an industry benchmark or anyone’s profile.';cls='synth';}
 else if(st.error){msg=st.snapshot?`Could not refresh at ${fmt(st.error.at)}: ${st.error.text} Still showing the snapshot from ${fmt(st.shownAt)}.`:st.error.text;cls='err';}
 else if(st.frozen){msg=`Frozen at ${fmt(st.shownAt)}. This view will not change until you unfreeze.`;cls='frozen';}
 b.hidden=!msg;b.textContent=msg;b.className='banner '+cls;
 const board=$('board');
 if(st.synthetic)board.innerHTML=syntheticHtml();
 else if(!st.connected&&!st.snapshot)board.innerHTML=`<div class="empty"><h2>Not connected</h2><p>${collectorUrl?'Choose the session and enter the facilitator key in the controls above, then Connect.':'The collector address is not set in config.js yet, so nothing can be read.'}</p></div>`;
 else if(st.loading&&!st.snapshot)board.innerHTML='<div class="empty"><h2>Loading…</h2></div>';
 else if(st.snapshot)board.innerHTML=boardHtml(st.snapshot);
 else board.innerHTML='<div class="empty"><h2>No snapshot yet</h2><p>The first refresh did not complete. Try Refresh.</p></div>';
}

// ---- Wiring -------------------------------------------------------------------------------
(C.sessions||[]).forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.label;$('session').append(o);});
const want=new URLSearchParams(location.search).get('session');
if(want&&[...$('session').options].some(o=>o.value===want))$('session').value=want;else $('session').selectedIndex=-1;
$('connect').addEventListener('submit',connect);
$('refresh').addEventListener('click',refresh);
$('freeze').addEventListener('click',toggleFreeze);
$('synthetic').addEventListener('click',toggleSynthetic);
$('disconnect').addEventListener('click',disconnect);
$('hide').addEventListener('click',toggleControls);
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|SELECT|TEXTAREA)$/.test((e.target||{}).tagName))return;
 const k=e.key.toLowerCase();
 if(k==='r')refresh();else if(k==='f')toggleFreeze();else if(k==='h')toggleControls();
});
try{const k=sessionStorage.getItem(KEY_STORE);if(k){$('key').value=k;}}catch(e){}
setInterval(()=>{if(st.shownAt&&!st.synthetic)$('snapshot').innerHTML=`${fmt(st.shownAt)} <span class="age">${esc(age(st.shownAt))}</span>`;},30000);
render();
})();
