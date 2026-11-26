(function(){
'use strict';
const D=window.HEA_DATA,E=window.HEA_ENGINE,app=document.getElementById('app'),W=window.HEA_WORKSHOP||{};
// Workshop collector only. The pilot's collector is refused by ID and by shape, so a copied
// config can never send workshop answers to the pilot sheet. Empty means submission is off.
const PILOT_COLLECTOR_ID='AKfycbyGgFzMvzFunL9MXWww0rAq14PYqkbJ-6Xnc5DctBqLYxUCWRT1W0vadCzkZ0PoVCz3';
const collectorUrl=(u=>/^https:\/\/script\.google\.com\/(?:a\/macros\/[a-z0-9.-]+|macros)\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(u)&&!u.includes(PILOT_COLLECTOR_ID)?u:'')(String(W.collectorUrl||'').trim());
const eventId=String(W.eventId||'').trim(),buildVersion=String(W.buildVersion||'').trim(),privacyUrl=String(W.privacyUrl||'').trim(),retentionNotice=String(W.retentionNotice||'').trim();
const sessionId=(new URLSearchParams(location.search).get('session')||'').trim();
// 'checking' | 'open' | 'closed' | 'unknown' | 'unreachable' | 'off' (no collector or no session link)
let sessionState=collectorUrl&&eventId&&/^[a-z0-9][a-z0-9-]{1,39}$/.test(sessionId)?'checking':'off',sessionInfo=null;
let openedAt=Date.now();
// Reference for this response: a record key for de-duplication, never an access token.
function newCode(){const a=new Uint8Array(8);crypto.getRandomValues(a);return 'HEA-'+Array.from(a,x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');}
let saveState='idle',epoch=0,retryTimer=null;
let stage=-1,answers={},contexts={},timings={},startedAt=null,completedAt=null,enteredAt=0,result=null,p1={area:null,obstacle:null,status:'not-answered'},feedback='',imported=false,pilotCode=newCode();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=i=>D.dimensions[i],level=n=>D.levels[n-1];
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function focusHeading(){requestAnimationFrame(()=>{const h=app.querySelector('h1');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});});}
function track(){if(stage>=0&&stage<20&&enteredAt){const q=stage<3?D.context[stage]:D.questions[stage-3];timings[q.id]=(timings[q.id]||0)+(performance.now()-enteredAt);enteredAt=0;}}
function collectNotice(){
 const closing=' Closing or refreshing the tab clears your answers from this page.';
 const off=why=>`<p class="privacy collect-warning" role="status"><strong>Saving is switched off for this link.</strong> ${why} You can still complete the assessment: your result stays on this page and nothing is sent anywhere.${closing}</p>`;
 if(sessionState==='off')return off(!collectorUrl?'The workshop collector is not set up yet.':'This link does not name a workshop session. Open the link your facilitator gave you.');
 if(sessionState==='closed')return off('This workshop session is closed.');
 if(sessionState==='unknown')return off('This session link is not recognised. Ask your facilitator for the current link.');
 const label=sessionInfo?escape(sessionInfo.label):'London Forum workshop',rehearsal=sessionInfo&&sessionInfo.environment==='rehearsal';
 return `<p class="privacy collect-session"><strong>${label}</strong>${rehearsal?' <span class="env-tag">Rehearsal · use made-up answers</span>':''}${sessionState==='checking'?' <span class="muted">Checking the session…</span>':''}${sessionState==='unreachable'?' <span class="muted">Could not check the session just now; your answers will be sent when you finish.</span>':''}</p><p class="privacy">When you finish, your answers, your calculated result and any optional note are saved privately by Holistic Email Academy against this workshop session. We do not ask for your name or email. The room sees only combined patterns for the whole session, never individual answers, references or notes. Answers about your programme can still be sensitive, so keep names and confidential client details out of the optional note. ${escape(retentionNotice)}${privacyUrl?` <a href="${escape(privacyUrl)}" target="_blank" rel="noopener">Privacy policy</a>.`:''}${closing}</p>`;
}
async function checkSession(){
 if(sessionState!=='checking')return;
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),10000);
 try{
  const res=await fetch(collectorUrl+'?action=session&session='+encodeURIComponent(sessionId),{signal:ctl.signal}),r=await res.json();
  if(r&&r.ok&&r.session&&r.session.id===sessionId){sessionInfo=r.session;sessionState=r.session.status==='open'?'open':'closed';}
  else sessionState=r&&r.code==='unknown-session'?'unknown':'unreachable';
 }catch(e){sessionState='unreachable';}
 finally{clearTimeout(t);}
 const n=document.getElementById('collect-notice');if(n&&stage===-1)n.innerHTML=collectNotice();
}
function intro(){stage=-1;app.innerHTML=`<div class="hero"><section><span class="eyebrow">Your programme. A clearer next step.</span><h1>Understand where your email programme stands.</h1><p class="lead">See what’s working, what may be holding progress back, and where to focus next.</p><p>Choose one programme you know reasonably well. Answer three short context questions and 17 questions about what normally happens now.</p><div class="actions"><button class="primary" id="begin">Begin assessment <span aria-hidden="true">→</span></button><span class="muted">Allow 15–20 minutes</span></div><div id="collect-notice">${collectNotice()}</div><button class="link-button" id="import">Open a saved record</button><input class="file-input" id="file" type="file" tabindex="-1" accept="application/json,.json" aria-label="Open saved record"><p class="error" id="import-error" role="alert"></p></section><aside class="side"><span class="eyebrow">Five dimensions</span><ol>${D.dimensions.map((d,i)=>`<li class="dim-${i}"><span>0${i+1}</span>${escape(d)}</li>`).join('')}</ol><h3>Assess the programme,<br>rather than yourself.</h3><p class="muted">Include work carried out by colleagues, agencies or providers where you have visibility. Choose “I don’t know” whenever you cannot answer.</p></aside></div><section class="intro-note"><h3>Before you begin</h3><p>Choose the closest description of normal practice. Where practice varies, use the lower description you can consistently support. Higher descriptions assume the relevant foundations are in place. Answer about what happens now, rather than what is planned or a one-off example of your best work.</p><p>“Regularly” means on a planned schedule appropriate to the programme. “Consistently” means part of normal practice across relevant work. You do not need to submit evidence or contact colleagues to finish.</p><p>A complete profile will identify the capabilities limiting progress. Where visibility is missing, the result will explain what your answers do and do not establish.</p></section>`;
 document.getElementById('begin').onclick=()=>{if(!startedAt)startedAt=Date.now();stage=0;renderQuestion();};
 document.getElementById('import').onclick=()=>document.getElementById('file').click();
 document.getElementById('file').onchange=importResult;
}
function renderQuestion(){
 const q=stage<3?D.context[stage]:D.questions[stage-3],isContext=stage<3,selection=isContext?contexts[q.id]:has(answers,q.id)?(answers[q.id]===null?5:answers[q.id]-1):undefined;
 const section=isContext?'About your programme':name(q.dimension);
 app.innerHTML=`<div class="form-shell"><div class="progress-label"><span>${escape(section)}</span><span>Question ${stage+1} of 20</span></div><div class="progress" role="progressbar" aria-label="Assessment progress" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${stage}"><span style="width:${stage*5}%"></span></div><div class="question-head"><span class="eyebrow">${isContext?'Context':'Your programme'} · ${q.id}</span><h1 id="question-title">${escape(q.stem)}</h1><p class="helper" id="helper">${escape(q.helper)}</p></div><fieldset class="options" aria-labelledby="question-title" aria-describedby="helper"><legend class="sr-only">Choose one answer</legend>${q.options.map((o,i)=>`<label class="option"><input type="radio" name="answer" value="${i}" ${selection===i?'checked':''}><span class="letter" aria-hidden="true">${String.fromCharCode(65+i)}</span><span class="wording">${escape(o)}</span></label>`).join('')}</fieldset><div class="nav"><button class="secondary" id="back">← Back</button><button class="primary" id="next" ${selection===undefined?'disabled':''}>${stage===19?'See my profile':'Next question'} <span aria-hidden="true">→</span></button></div><p class="muted">Choose one answer. You can go back and change it.</p></div>`;
 app.querySelectorAll('input[name="answer"]').forEach(el=>el.onchange=()=>{const i=Number(el.value);if(isContext)contexts[q.id]=i;else answers[q.id]=i===5?null:i+1;document.getElementById('next').disabled=false;});
 document.getElementById('back').onclick=()=>{track();if(stage===0)intro();else{stage--;renderQuestion();}};
 document.getElementById('next').onclick=()=>{if(!(isContext?has(contexts,q.id):has(answers,q.id)))return;track();stage++;if(stage===20){const first=!completedAt;if(first)completedAt=Date.now();result=E.calculate(D.questions.map(q=>answers[q.id]));if(first||p1.status==='not-answered')p1={area:result.constraints.length===1?result.constraints[0]:null,obstacle:null,status:'not-answered'};showResult();save();}else renderQuestion();};
 enteredAt=performance.now();focusHeading();
}
function listTopics(indices){return indices.map(i=>`<li>${escape(D.questions[i].title)} <span class="muted">(${D.questions[i].id})</span></li>`).join('');}
const actions=D.actions;
function actionFor(i){let [now,next]=actions[i];if(contexts.C2===0&&i===0)now='Agree the programme objective and arrange ownership for one identified gap.';else if(contexts.C2>=2||contexts.C2===undefined){now='Share this finding with the relevant owner: '+now.charAt(0).toLowerCase()+now.slice(1);next='Propose the next step: '+next.charAt(0).toLowerCase()+next.slice(1);}return [now,next];}
// The takeaway: focus, then evidence, then first action (workshop script slides 7-10). Built only from the
// existing result; it adds no question and changes no score.
function orList(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' or '+a[a.length-1];}
function takeaway(){
 const focus=result.state==='complete'
  ?(result.constraints.length===1?`<strong>${escape(name(result.constraints[0]))}</strong>, currently ${escape(level(result.level))}.`:`${escape(orList(result.constraints.map(name)))} share the lowest level, ${escape(level(result.level))}. Choose one to work on today.`)
  :`Your answers do not yet identify a reliable focus. Choose an area where you need better visibility and write down what you want to find out${result.unknowns.length?' (see “Check with a colleague or provider” below)':''}.`;
 return `<div class="box takeaway"><span class="eyebrow">Your workshop takeaway</span><ol><li><h3>Focus</h3><p>${focus}</p><p class="muted">Which answers in that area stand out, and what needs a closer look? It is somewhere to investigate, not proof of a cause.</p></li><li><h3>Evidence</h3><p>What are you unsure about? What evidence would help you check (a recent campaign, a test record, a process or a report), and who could help you find it?</p></li><li><h3>First action</h3><p>One achievable step, who will take it forward, what help or agreement they need, when you will review it and what would show progress. Improved visibility counts as progress.</p></li></ol></div>`;
}
function headingCopy(){
 if(result.state==='complete')return [level(result.level),`Your programme’s current self-reported maturity is ${level(result.level)}. ${result.constraints.map(name).join(' and ')} ${result.constraints.length===1?'is the binding constraint':'are joint binding constraints'}.`];
 if(result.state==='confirmed-partial')return [level(result.level)+' · partial profile',`Your available answers support an overall level of ${level(result.level)}, even allowing for the answers you could not give. Your profile remains incomplete; the binding dimension may change.`];
 if(result.state==='range')return [level(result.lowerLevel)+' to '+level(result.upperLevel),`Your overall maturity is not yet determined. Your answers support a range from ${level(result.lowerLevel)} to ${level(result.upperLevel)}. Check the unknown topics to narrow this range.`];
 return ['More visibility needed','We do not yet have enough visibility to identify your programme’s overall maturity. Your known answers still show specific practices to retain or address.'];
}
function showResult(){
 stage=20;const [heading,copy]=headingCopy();const strong=result.dimensions.filter(d=>d.complete&&d.score.level>(result.level||result.upperLevel));
 const priorities=result.state==='complete'?result.constraints:[];
 const knownStronger=strong.map(d=>name(d.index)).join(', ');const knownHigh=D.questions.flatMap((q,i)=>answers[q.id]>=4?[i]:[]);
 const guidance=priorities.length?priorities.map(i=>{const a=actionFor(i);return `<div class="next-action"><h3>${escape(name(i))}</h3><span class="eyebrow do-now">Do now</span><p>${escape(a[0])}</p><span class="eyebrow build-next">Build next</span><p>${escape(a[1])}</p></div>`;}).join(''):`<div class="next-action"><span class="eyebrow do-now">Do now</span><p>Check the listed unknown topics with the colleague or provider responsible. Address any known foundational risks while you obtain that information.</p><span class="eyebrow build-next">Build next</span><p>Use the fuller profile to agree which area to prioritise. A missing answer is a visibility gap, not evidence that the capability is absent.</p></div>`;
 app.innerHTML=`<section class="result-head"><span class="eyebrow">Your programme profile · ${escape(pilotCode)}</span><p class="print-only print-date">Completed ${escape(new Date(completedAt||Date.now()).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}))}</p><h1>${escape(heading)}</h1><p class="lead">${escape(copy)}</p><p class="muted">This reflects your answers about normal practice. It is a starting point for improvement, not an independent audit.${completedAt&&startedAt?' Questionnaire time: '+Math.ceil((completedAt-startedAt)/60000)+(Math.ceil((completedAt-startedAt)/60000)===1?' minute.':' minutes.'):''}</p></section><div class="result-grid"><section aria-label="Five dimension profile"><div class="profile">${result.dimensions.map(d=>`<div class="dimension dim-${d.index}"><div class="dim-top"><span>${escape(name(d.index))}</span><strong class="${d.complete?'lvl-'+d.score.level:''}">${d.complete?level(d.score.level):'Insufficient visibility'}</strong></div><div class="bar ${d.complete?'':'partial'}" aria-hidden="true">${Array.from({length:5},(_,i)=>`<i class="${d.complete&&i<d.score.level?'filled':''}"></i>`).join('')}</div>${d.complete&&d.score.ceilingApplied?`<p class="dim-note">${d.indices.filter(i=>answers[D.questions[i].id]===d.score.lowest).map(i=>escape(D.questions[i].title)).join(', ')} currently limits this dimension to ${level(d.score.ceiling)}.</p>`:''}${!d.complete?`<p class="dim-note">Unknown: ${d.unknowns.map(i=>escape(D.questions[i].title)).join(', ')}. No score has been assigned to this dimension.</p>`:''}</div>`).join('')}</div><div class="axis" aria-hidden="true">${D.levels.map((x,i)=>`<span class="lvl-${i+1}">${x}</span>`).join('')}</div>${knownStronger?`<div class="box strengths" style="margin-top:24px"><h3>Strengths to retain</h3><p>${escape(knownStronger)} ${strong.length===1?'is':'are'} stronger than the overall result. Use those capabilities while improving the limiting areas.</p></div>`:''}${!knownStronger&&knownHigh.length?`<div class="box strengths" style="margin-top:24px"><h3>Practices to retain</h3><p>Your answers indicate stronger practice in these topics. Retain them while addressing gaps elsewhere.</p><ul>${listTopics(knownHigh)}</ul></div>`:''}${result.risks.length?`<div class="box caution" style="margin-top:24px"><h3>Foundational risks</h3><p>These practices need attention even if other answers are stronger.</p><ul>${listTopics(result.risks)}</ul></div>`:''}${result.gaps.length?`<div class="box gaps"><h3>Constraining gaps</h3><p>These answers reduced a dimension’s final level. A dimension can be at most one level above its lowest answer.</p><ul>${listTopics(result.gaps)}</ul></div>`:''}${result.unknowns.length?`<div class="box check"><h3>Check with a colleague or provider</h3><ul>${listTopics(result.unknowns)}</ul></div>`:''}</section><aside>${takeaway()}<div class="box"><h2>A useful next step</h2>${guidance}<span class="eyebrow get-support">Get support</span><p id="support-copy">Start with practical guidance and a conversation with the relevant owner. The result alone does not prove you need training. Use the optional question below to clarify what is making progress difficult.</p></div><div class="actions"><button class="primary" id="download">Download my record</button><button class="secondary" id="print">Print result</button><button class="link-button" id="edit">Review my answers</button></div><p class="muted save-status" id="save-status" role="status"></p><p class="privacy">The download includes your answers, timings and any optional note. It stays on your device unless you choose to share it.</p></aside></div><div id="courses"></div><div class="results-bottom"><section><span class="eyebrow">Optional · after your result</span><h2>What’s making progress difficult?</h2><p>Your answer can help guide the next step. It does not change your maturity result.</p><label class="field-label" for="area">Which area are you thinking about?</label><select id="area"><option value="">Choose an area (optional)</option>${D.dimensions.map((x,i)=>`<option value="${i}">${escape(x)}</option>`).join('')}<option value="several">Not sure / several areas</option></select><label class="field-label" for="obstacle">What is the main thing making this area difficult to improve?</label><select id="obstacle"><option value="">Choose an answer (optional)</option>${D.obstacles.map((x,i)=>`<option value="${i}">${escape(x)}</option>`).join('')}</select><div class="actions"><button class="primary" id="use-support">Use this to guide my next step</button><button class="secondary" id="skip">Skip</button></div><p class="muted" id="p1-status" role="status"></p></section><section><span class="eyebrow">Optional · for the debrief</span><h2>Anything to flag?</h2><label for="feedback" class="field-label">Was an answer unclear, difficult to choose or missing?</label><textarea id="feedback" maxlength="2000" placeholder="Please avoid names and confidential client details."></textarea><p class="muted">${canSave()?'This note is saved privately with your response and is never shown to the room.':'This note stays in this tab and is included only if you download your record.'}</p><button class="link-button" id="restart">Start a new test</button></section></div>`;
 document.getElementById('area').value=p1.area===null?'':String(p1.area);
 document.getElementById('obstacle').value=p1.obstacle===null?'':String(p1.obstacle);
 document.getElementById('feedback').value=feedback;
 document.getElementById('feedback').oninput=e=>feedback=e.target.value;
 document.getElementById('use-support').onclick=()=>{const area=document.getElementById('area').value,o=document.getElementById('obstacle').value;p1={area:area===''?null:area==='several'?'several':Number(area),obstacle:o===''?null:Number(o),status:o===''?'not-answered':'answered'};support();save();};
 document.getElementById('skip').onclick=()=>{p1={area:null,obstacle:null,status:'skipped'};document.getElementById('area').value='';document.getElementById('obstacle').value='';support();save();};
 document.getElementById('download').onclick=download;
 document.getElementById('feedback').onchange=()=>save();

 document.getElementById('print').onclick=()=>window.print();
 document.getElementById('edit').onclick=()=>{stage=0;renderQuestion();};
 document.getElementById('restart').onclick=()=>{if(confirm('Start again? Download your current record first if you want to keep it.')){epoch++;saveRevision=0;saveState='idle';clearTimeout(retryTimer);answers={};contexts={};timings={};openedAt=Date.now();startedAt=null;completedAt=null;result=null;feedback='';imported=false;p1={area:null,obstacle:null,status:'not-answered'};pilotCode=newCode();intro();focusHeading();}};
 support();renderCourses();renderSaveStatus();focusHeading();
}
// Courses for the areas holding the result back (courses.js). It loads as a
// module, so it may arrive after the result is drawn.
const LEVEL_BAND={foundation:'Foundation',intermediate:'Intermediate',advanced:'Advanced'};
const A=window.HEA_ADVICE;
const ACADEMY_URL='https://holisticemailacademy.com/courses/?utm_source=hem-assessment&utm_medium=assessment&utm_campaign=maturity-assessment&utm_content=later';
function renderCourses(){
 const host=document.getElementById('courses');
 if(!host||!result)return;
 const mode=A.courseMode(p1);
 const setSupport=shows=>{const el=document.getElementById('support-copy');if(el)el.textContent=A.supportCopy(p1,shows);};
 if(mode==='link'){setSupport(true);host.innerHTML=`<section class="courses courses-later" aria-labelledby="courses-title"><span class="eyebrow">Holistic Email Academy</span><h2 id="courses-title">For later</h2><p>When this area becomes a priority, <a href="${ACADEMY_URL}" target="_blank" rel="noopener">the Academy's courses</a> are there.</p></section>`;return;}
 if(!window.HEA_COURSES){setSupport(false);return;}
 const list=window.HEA_COURSES.suggest(A.courseTargets(result));
 setSupport(list.length>0);
 if(!list.length){host.innerHTML='';return;}
 const names=[...new Set(list.map(c=>c.dimension))].map(name),areas=names.length>1?names.slice(0,-1).join(', ')+' and '+names[names.length-1]:names[0];
 const promoted=mode==='promoted';
 const intro=promoted
  ?`You said a knowledge or skills gap is making progress difficult. These Academy courses cover ${escape(areas)}.`
  :`If you want to build skills in ${escape(areas)}, these Academy courses cover it. Your next step above comes first.`;
 host.innerHTML=`<section class="courses${promoted?'':' courses-optional'}" aria-labelledby="courses-title"><span class="eyebrow">Holistic Email Academy</span><h2 id="courses-title">${promoted?'Courses that cover this':'Optional: courses for this area'}</h2><p>${intro}</p><div class="course-cards">${list.map((c,n)=>`<div class="course-card is-${c.courseLevel}"><div class="course-tags"><span class="course-level">${LEVEL_BAND[c.courseLevel]||''}</span><span class="course-status ${c.live?'is-live':'is-waitlist'}">${escape(c.status)}</span></div><strong class="course-title">${escape(c.title)}</strong><p class="muted">${c.confirmed?`For ${escape(name(c.dimension))}, currently ${escape(level(c.level))}.`:`For ${escape(name(c.dimension))}. Some answers here were “I don’t know”, so its level is not yet confirmed.`}</p>${c.offer?`<p class="course-offer">${escape(c.offer)}</p>`:''}<a class="${promoted&&n===0?'primary':'secondary'} course-link" href="${escape(c.url)}" target="_blank" rel="noopener">${escape(c.button)}</a></div>`).join('')}</div></section>`;
}
window.addEventListener('hea-courses-ready',renderCourses);
// Also redraws the course panel: how prominent courses are depends on the obstacle answer.
function support(){
 renderCourses();
 const hasArea=Number.isInteger(p1.area);
 document.getElementById('p1-status').textContent=p1.status==='skipped'?'Skipped. Your result is unchanged.':p1.status==='answered'?(hasArea?'Your stated obstacle is recorded for '+name(p1.area)+'. Your score is unchanged.':'Your stated obstacle is recorded without a specific area; guidance remains general. Your score is unchanged.'):'You can answer or skip. Your result is already available.';
}
function exportRecord(){
 return {schema:'hea-assessment-workshop-v1',questionnaireVersion:D.version,prototypeVersion:D.prototypeVersion,workshopBuildVersion:buildVersion,eventId,sessionId,responseId:pilotCode,pilotCode,openedAt:new Date(openedAt).toISOString(),startedAt:startedAt?new Date(startedAt).toISOString():null,completedAt:completedAt?new Date(completedAt).toISOString():null,questionnaireMilliseconds:startedAt&&completedAt?completedAt-startedAt:null,includingIntroductionMilliseconds:completedAt?completedAt-openedAt:null,context:D.context.map(q=>({id:q.id,option:contexts[q.id],answer:q.options[contexts[q.id]]})),answers:D.questions.map(q=>({id:q.id,answerId:q.id+'.'+(answers[q.id]===null?'UNKNOWN':String.fromCharCode(64+answers[q.id])),score:answers[q.id],answer:q.options[answers[q.id]===null?5:answers[q.id]-1]})),timingsMilliseconds:Object.fromEntries(Object.entries(timings).map(([k,v])=>[k,Math.round(v)])),result,p1,feedback};
}
// Results are saved when the result appears and again when anything changes. One save runs at a time;
// edits made meanwhile are sent together afterwards, so the last request always carries the latest state
// and "saved" appears only once the collector has confirmed that latest state. Each request is numbered and
// the collector keeps the highest number, so a late older request cannot replace newer data. A failed or
// timed-out request is retried with back-off (the same response ID, so retries never add a second record).
// Records opened from a file are never sent.
const SAVE_TIMEOUT=30000,RETRY_DELAYS=[2000,5000,10000,20000],sleep=ms=>new Promise(r=>setTimeout(r,ms));
let saveRevision=0,saving=false,saveAgain=false;
function canSave(){return !!collectorUrl&&sessionState!=='off'&&sessionState!=='closed'&&sessionState!=='unknown';}
function nextRecord(){return {...exportRecord(),saveRevision:++saveRevision};}
function confirmed(r,rec){return !!r&&r.ok===true&&r.schema==='hea-workshop-collector-v1'&&r.saved===true&&r.responseId===rec.responseId&&r.sessionId===rec.sessionId&&Number.isInteger(r.revision)&&r.revision>=rec.saveRevision;}
async function send(rec){
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),SAVE_TIMEOUT);
 try{
  // A plain-text body keeps this a simple request, so the browser skips the CORS preflight Apps Script cannot answer.
  const res=await fetch(collectorUrl,{method:'POST',body:JSON.stringify(rec),signal:ctl.signal});
  return await res.json();
 }finally{clearTimeout(t);}
}
const SAVE_COPY={
 saving:'Saving…',
 retrying:'Could not reach the workshop collector. Trying again…',
 saved:'Your answers and result are saved to this workshop session. Only combined patterns are shown to the room.',
 closed:'This workshop session is closed, so your answers were not submitted. Your result is still yours: print it or download it.',
 unknown:'This session link is not recognised, so your answers were not submitted. Your result is still yours: print it or download it.',
 off:'Saving is switched off for this link, so nothing was sent. Your result is still yours: print it or download it.'
};
function renderSaveStatus(){
 const el=document.getElementById('save-status');if(!el)return;
 let state=saveState;
 if(imported){el.textContent='This record was opened from a file, so it is not sent anywhere.';return;}
 if(!canSave()&&state==='idle')state=sessionState==='closed'?'closed':sessionState==='unknown'?'unknown':'off';
 if(state==='failed'){
  el.innerHTML='Not saved yet. Your result is still on this page. <button class="link-button" id="save-retry" type="button">Try saving again</button>';
  document.getElementById('save-retry').onclick=()=>save();return;
 }
 el.textContent=SAVE_COPY[state]||'';
}
function setSaveState(s){saveState=s;renderSaveStatus();}
async function save(){
 if(!result||imported)return;
 if(!canSave()){renderSaveStatus();return;}
 if(saving){saveAgain=true;return;}
 saving=true;clearTimeout(retryTimer);
 const mine=epoch;let outcome='failed',attempt=0;
 setSaveState('saving');
 do{
  saveAgain=false;
  if(!result||imported||mine!==epoch)break;
  const rec=nextRecord();
  try{
   const reply=await send(rec);
   if(mine!==epoch)break;
   if(confirmed(reply,rec)){outcome='saved';attempt=0;}
   else if(reply&&(reply.code==='session-closed'||reply.code==='unknown-session'||reply.code==='not-configured')){
    sessionState=reply.code==='session-closed'?'closed':reply.code==='unknown-session'?'unknown':'off';outcome=sessionState;saveAgain=false;break;
   }else outcome='failed';
  }catch(err){if(mine!==epoch)break;outcome='failed';}
  if(outcome==='failed'&&!saveAgain&&attempt<RETRY_DELAYS.length){
   setSaveState('retrying');
   await sleep(RETRY_DELAYS[attempt++]+Math.random()*1000);
   if(mine!==epoch)break;
   saveAgain=true;
  }
 }while(saveAgain);
 saving=false;
 if(mine!==epoch)return;
 setSaveState(outcome==='saved'?'saved':outcome==='failed'?'failed':outcome);
}
function download(){const record=exportRecord(),blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=pilotCode+'-review04.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importResult(e){
 try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw new Error('This file is too large for a record.');const record=JSON.parse(await file.text());
 if(record.schema!=='hea-assessment-workshop-v1'||record.questionnaireVersion!==D.version)throw new Error('Choose a record downloaded from this workshop assessment.');
 if(!Array.isArray(record.answers)||record.answers.length!==17||!Array.isArray(record.context)||record.context.length!==3)throw new Error('The test record is incomplete.');
 const array=record.answers.map((v,i)=>{if(!v||v.id!==D.questions[i].id)throw new Error('Question IDs do not match.');return v.score;});
 const checked=E.calculate(array),c={};record.context.forEach((v,i)=>{if(!v||v.id!==D.context[i].id||!Number.isInteger(v.option)||v.option<0||v.option>=D.context[i].options.length)throw new Error('Context answers are not valid.');c[v.id]=v.option;});
 answers=Object.fromEntries(D.questions.map((q,i)=>[q.id,array[i]]));contexts=c;result=checked;imported=true;saveState='idle';
 pilotCode=String(record.responseId||record.pilotCode||'HEA-SAVED').replace(/[^A-Za-z0-9-]/g,'').slice(0,40)||'HEA-SAVED';
 feedback=typeof record.feedback==='string'?record.feedback.slice(0,2000):'';
 timings={};for(const [k,v] of Object.entries(record.timingsMilliseconds||{})){if(/^(Q(?:[1-9]|1[0-7])|C[1-3])$/.test(k)&&Number.isFinite(v)&&v>=0)timings[k]=v;}
 startedAt=Date.parse(record.startedAt)||null;completedAt=Date.parse(record.completedAt)||null;openedAt=Date.parse(record.openedAt)||startedAt||Date.now();if(!startedAt||!completedAt||completedAt<startedAt){startedAt=null;completedAt=null;}if(completedAt&&openedAt>completedAt)openedAt=startedAt;
 const x=record.p1||{};p1={area:Number.isInteger(x.area)&&x.area>=0&&x.area<5?x.area:x.area==='several'?'several':null,obstacle:Number.isInteger(x.obstacle)&&x.obstacle>=0&&x.obstacle<D.obstacles.length?x.obstacle:null,status:['answered','skipped','not-answered'].includes(x.status)?x.status:'not-answered'};
 showResult();
 }catch(err){document.getElementById('import-error').textContent=err instanceof SyntaxError||err instanceof TypeError?'Could not open this record.':err.message||'Could not open this record.';e.target.value='';}
}
window.addEventListener('beforeunload',e=>{if(stage>=0&&stage<20){e.preventDefault();e.returnValue='';}});
intro();
checkSession();
})();
