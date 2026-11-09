import {TYPES,CONCEPTS,identity,attributes,skills,bodyFields,missionFields,npcFields,newSheet,validateArchive,validateData,generator,FORMAT} from './model.js';
const $=s=>document.querySelector(s),KEY='ctth-sheets-v1',DATAKEY='ctth-sheets-tables-v1',THEMEKEY='ctth-sheets-theme';
/* Sheets saved before the ctth rename live under coriolis-sheets-*; carry them over once. */
try{for(const [from,to] of [['coriolis-sheets-v1',KEY],['coriolis-sheets-tables-v1',DATAKEY],['coriolis-sheets-theme',THEMEKEY]]){if(localStorage.getItem(to)==null){const v=localStorage.getItem(from);if(v!=null)localStorage.setItem(to,v);}}}catch{}
const el=(tag,attrs={},...children)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else n.setAttribute(k,v);}n.append(...children.flat().filter(x=>x!=null));return n;};
let presets={npcs:[],ships:[]},saveWarning='';
let sheets=[],active,type='character',data=null,dataSource='',startupError='',loadFailed=false;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved){const checked=validateArchive({format:'coriolis-sheets-backup/1',sheets:saved.sheets});sheets=checked.map((s,i)=>({...s,id:typeof saved.sheets[i].id==='string'?saved.sheets[i].id:s.id}));active=saved.active;if(saved.type&&Object.hasOwn(TYPES,saved.type))type=saved.type;}}
catch{startupError='The saved archive could not be read. Export your current work before reloading; the original browser data has been left untouched.';loadFailed=true;}
if(!sheets.length)sheets=[newSheet('character')];
if(!sheets.some(s=>s.id===active))active=sheets[0].id;
const current=()=>sheets.find(s=>s.id===active);
function status(s){$('#save-status').textContent=[s,saveWarning].filter(Boolean).join(' ');}
function persist(){if(loadFailed){status(startupError);return;}try{localStorage.setItem(KEY,JSON.stringify({sheets,active,type}));saveWarning='';status('Saved in this browser.');}catch{saveWarning='Changes are not saved: browser storage is unavailable or full. Export a backup now.';status('');}}
function touch(){current().updated=new Date().toISOString();persist();updateLibrary();pushSheet();}
function title(s){return s.values.name||`Untitled ${TYPES[s.type].toLowerCase()}`;}
function updateLibrary(){const l=$('#library');l.replaceChildren(...sheets.filter(s=>s.type===type).map(s=>el('option',{value:s.id,text:title(s)})));l.value=active;}
function switchType(t){type=t;let s=sheets.find(s=>s.type===t);if(!s){s=newSheet(t);sheets.push(s);}active=s.id;persist();render();}
function printSpan(value,kind){return el('span',{class:'print-value',text:kind==='check'?(value?'Yes':'No'):String(value??'')});}
function control(obj,field,scope='sheet'){
 const [key,label,kind]=field,opts=Array.isArray(kind)?kind:null;
 const input=opts?el('select'):kind==='area'?el('textarea',{rows:3}):el('input',{type:kind==='number'?'number':kind==='check'?'checkbox':'text'});
 input.id=`${scope}-${key}`;input.setAttribute('aria-label',label);if(kind==='number'){input.step='any';}
 if(opts){input.append(el('option',{value:'',text:'—'}),...opts.map(v=>el('option',{value:v,text:v})));}
 if(kind==='check')input.checked=!!obj[key];else input.value=obj[key]??'';
 const mirror=printSpan(obj[key],kind);
 input.addEventListener('input',()=>{obj[key]=kind==='check'?input.checked:input.value;mirror.textContent=kind==='check'?(input.checked?'Yes':'No'):input.value;if(kind==='area')grow(input);touch();updateDerived();if(key==='name')$('#sheet-heading').textContent=title(current());if(key==='distance'||(scope.startsWith('entry')&&key==='name'))drawChart();});
 const labelEl=el('label',{class:'field'+(kind==='area'?' long':'')},el('span',{text:label}),input,mirror);return labelEl;
}
function grow(input){input.style.height='auto';input.style.height=input.scrollHeight+'px';}
function fieldset(title,fields,obj=current().values,wide=false,scope='sheet'){return el('section',{class:'section'+(wide?' wide':'')},el('h3',{text:title}),el('div',{class:'fields'},fields.map(f=>control(obj,f,scope))));}
const F=(key,label,type='text')=>[key,label,type];
function derived(obj,label='Mind points'){const node=el('div',{class:'derived','data-derived':'','data-mind-label':label});node._values=obj;return node;}
function updateDerived(){document.querySelectorAll('[data-derived]').forEach(n=>{const v=n._values;const sum=(a,b)=>v[a]!==''&&v[a]!=null&&v[b]!==''&&v[b]!=null?Number(v[a])+Number(v[b]):'—';n.replaceChildren(el('span',{},'Hit point maximum: ',el('b',{text:sum('strength','agility')})),el('span',{},n.dataset.mindLabel+' maximum: ',el('b',{text:sum('wits','empathy')})));});}
function table(title,key,columns,rows=3){
 const s=current();if(!s.tables[key])s.tables[key]=Array.from({length:rows},()=>({}));const entries=s.tables[key];
 const section=el('section',{class:'section wide'},el('h3',{text:title}));const tb=el('tbody');
 const renderRows=()=>{tb.replaceChildren(...entries.map((row,i)=>{const tr=el('tr');for(const f of columns){const c=control(row,f,`${key}-${i}`),input=c.querySelector('input,textarea,select'),p=c.querySelector('.print-value');tr.append(el('td',{},input,p));}tr.append(el('td',{class:'no-print'},el('button',{class:'mini',text:'×','aria-label':`Remove ${title.toLowerCase()} row ${i+1}`,onclick:()=>{entries.splice(i,1);touch();renderRows();}})));return tr;}));};renderRows();
 section.append(el('div',{class:'table-scroll'},el('table',{},el('thead',{},el('tr',{},columns.map(c=>el('th',{scope:'col',text:c[1]})),el('th',{class:'no-print',text:''}))),tb)),el('button',{class:'mini actions no-print',text:'Add row',onclick:()=>{if(entries.length>=100)return status('Maximum 100 rows per table.');entries.push({});touch();renderRows();}}));return section;
}
function character(grid){
 grid.append(fieldset('Identity',identity,current().values,true),fieldset('Attributes',attributes),fieldset('Appearance',[F('face','Face','area'),F('clothing','Clothing','area')]),fieldset('Trauma',[F('hp','Hit points taken','number'),F('mp','Mind points taken','number'),F('radiation','Radiation','number'),F('injuries','Critical injuries','area')]),fieldset('Development',[F('xp','Experience','number'),F('talents','Talents','area')]));
 grid.children[3].append(derived(current().values));
 grid.append(fieldset('Skills · general and advanced',skills,current().values,true),table('Relationships','relationships',[F('pc','PC'),F('relationship','Relationship'),F('buddy','Buddy','check')],4),table('Weapons','weapons',[F('name','Weapon'),F('bonus','Bonus'),F('init','Init'),F('damage','Damage'),F('crit','Crit'),F('range','Range'),F('comments','Comments'),F('reloads','Reloads')]),table('Gear','gear',[F('item','Item'),F('bonus','Bonus')],10),table('Armour','armour',[F('name','Armour'),F('rating','Rating'),F('comment','Comment')],1),fieldset('Personal effects',[F('birr','Birr','number'),F('tiny','Tiny items','area')]),fieldset('My cabin',[F('cabin','Description','area'),F('cabinGear','Gear','area'),F('cabinOther','Other','area')]),table('People I have met','people',[F('name','Name'),F('concept','Concept'),F('notes','Notes')]),fieldset('Notes',[F('notes','Notes','area')],current().values,true));
}
function ship(grid){
 if(!current().tables.crew)current().tables.crew=['Pilot','Engineer','Captain','Gunner','Sensor operator'].map(position=>({position}));
 grid.append(fieldset('Ship registry',[F('name','Name'),F('classType','Class & type'),F('shipyard','Shipyard'),F('problem','Problem','area'),F('debt','Debt')],current().values,true),fieldset('Ship data',['manoeuvrability','signature','speed','armour'].map(k=>F(k,k[0].toUpperCase()+k.slice(1),'number'))),fieldset('Condition',[F('energy','Energy points','number'),F('hull','Hull points','number'),F('maxModules','Maximum modules','number'),F('critical','Critical damage','area')]),table('Crew stations','crew',[F('position','Position'),F('name','Crew member'),F('skill','Skill'),F('level','Level')],5),table('Modules','modules',[F('name','Module'),F('disabled','Disabled','check')],20),table('Weapons','weapons',[F('name','Weapon'),F('bonus','Bonus'),F('damage','Damage'),F('crit','Crit'),F('range','Range'),F('comments','Comments')]),table('Features','features',[F('name','Feature'),F('bonus','Bonus')]),fieldset('Cargo and gear',[F('cargo','Cargo and gear','area')],current().values,true),table('Ship’s log','log',[F('destination','Destination'),F('ccSegment','CC / segment'),F('route','Route'),F('danger','Danger'),F('notes','Notes')],4));

}
function repeats(grid,fields,label){const s=current();s.entries.forEach((obj,i)=>{
 const section=fieldset(`${label} ${String(i+1).padStart(2,'0')}`,fields,obj,true,`entry${i}`);section.classList.add('repeat-card');if(type==='npc')section.prepend(presetPicker('npc',obj,i));if(type==='npc')section.append(derived(obj,'Stress points'));
 if(obj.cid&&CAMPAIGN){const linked=CAMPAIGN.get(type,obj.cid);section.append(el('div',{class:'campaign-link no-print'},el('span',{class:'campaign-chip',text:'Campaign'}),el('span',{class:'campaign-name',text:(linked&&linked.name)||'shared'}),type==='npc'?el('a',{class:'mini',href:`/tools/ctth-spreads/?npc=${encodeURIComponent(obj.cid)}`,text:'Draw a spread'}):null,el('button',{class:'mini',text:'Unlink',onclick:()=>{delete obj.cid;touch();render();status('Unlinked here. The campaign keeps its own copy.');}})));}
 section.append(el('button',{class:'mini actions no-print',text:`Remove ${label.toLowerCase()}`,onclick:()=>{s.entries.splice(i,1);touch();render();}}));grid.append(section);
 });grid.append(el('button',{class:'btn no-print',text:`Add ${label.toLowerCase()}`,onclick:()=>{if(s.entries.length>=100)return status('Maximum 100 entries per sheet.');s.entries.push(type==='system'?{kind:'Planet'}:{});touch();render();}}));}
function system(grid){grid.append(fieldset('System registry',[F('name','System name'),F('star','Star / stars'),F('notes','System notes','area')],current().values,true));grid.append(el('section',{class:'section wide'},el('h3',{text:'Orbital sketch'}),el('div',{id:'chart'}),el('p',{class:'note',text:'Bodies are ordered by distance. Positions use a square-root scale; add distances in AD to chart them.'})));repeats(grid,bodyFields,'Body');drawChart();}
function drawChart(){const container=$('#chart');if(!container)return;const ns='http://www.w3.org/2000/svg',sv=(tag,attrs={},text)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;return n;};const svg=sv('svg',{class:'orbit-chart',viewBox:'0 0 800 140',role:'img','aria-label':'System orbital sketch'});svg.append(sv('line',{x1:35,y1:65,x2:770,y2:65,stroke:'currentColor',opacity:.4}),sv('circle',{cx:35,cy:65,r:12,fill:'currentColor'}));const bodies=current().entries.filter(b=>b.distance!==''&&b.distance!=null&&Number.isFinite(+b.distance)&&+b.distance>=0).sort((a,b)=>+a.distance-+b.distance),max=Math.max(1,...bodies.map(b=>+b.distance));bodies.forEach((b,i)=>{const x=75+Math.sqrt(+b.distance/max)*670;svg.append(sv('circle',{cx:x,cy:65,r:b.kind==='Gas giant'?9:5,fill:b.kind==='Asteroid belt'?'none':'currentColor',stroke:'currentColor'}),sv('text',{x,y:i%2?105:27,'text-anchor':'middle',fill:'currentColor','font-size':11},(b.name||`Body ${i+1}`).slice(0,24)),sv('text',{x,y:i%2?120:42,'text-anchor':'middle',fill:'currentColor','font-size':10},b.distance+' AD'));});if(!bodies.length)svg.append(sv('text',{x:400,y:100,'text-anchor':'middle',fill:'currentColor','font-size':13},'Add body distances to draw your system'));container.replaceChildren(svg);}
function presetPicker(kind,obj,index){
 const select=el('select',{'aria-label':kind==='ship'?'Ship model preset':`NPC ${index+1} archetype`},el('option',{value:'',text:'Choose a '+(kind==='ship'?'ship model':'typical NPC')}));
 const list=kind==='ship'?presets.ships:presets.npcs;select.append(...list.map((p,i)=>el('option',{value:i,text:p.label})));
 return el('div',{class:'section wide no-print'},el('label',{class:'field'},el('span',{text:kind==='ship'?'Start from a ship model':'Start from an archetype'}),select),el('button',{class:'mini actions',text:kind==='ship'?'Create ship from model':'Add NPC from archetype',onclick:()=>{
  if(select.value==='')return;const p=list[Number(select.value)];
  if(kind==='ship'){const s=newSheet('ship');s.values=structuredClone(p.values);s.tables=structuredClone(p.tables);s.values.name=p.label;sheets.push(s);active=s.id;}
  else{if(current().entries.length>=100)return status('Maximum 100 NPCs per sheet.');const isBlank=!Object.values(obj).some(v=>v!==''&&v!=null);const values=structuredClone(p.values);if(isBlank)current().entries[index]=values;else current().entries.push(values);}
  touch();render();status('Preset loaded. All fields are editable.');
 }}),el('p',{class:'note',text:kind==='ship'?'Creates a new ship with model stats, modules and features. Your current ship is kept.':'Uses Table 15.1 attributes, reputation and skills. Fills a blank entry or adds a new NPC.'}));
}
/* ---------- the campaign ---------- */
const CAMPAIGN=window.CtthCampaign||null;
const saveCampaign=CAMPAIGN?CAMPAIGN.saver(700):()=>{};
const seen=new Map();
const SHIP_TABLES=['crew','modules','weapons','features','log'];
const isRepeatable=()=>type==='npc'||type==='mission';
function flatData(obj){const out={};for(const [k,v] of Object.entries(obj)){if(k==='cid'||k==='updated'||k==='rollLog')continue;if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')out[k]=v;}return out;}
function tablesFor(){const s=current(),out={};if(type==='ship')for(const k of SHIP_TABLES)out[k]=structuredClone(s.tables[k]||[]);if(type==='system')out.bodies=structuredClone(s.entries);return out;}
function entityFor(obj){return {id:obj.cid,name:obj.name||undefined,source:'sheets',data:{...flatData(obj),...tablesFor()},refs:{sheetId:current().id}};}
function pushObj(obj){if(!CAMPAIGN||!obj||!obj.cid)return;const e=CAMPAIGN.upsert(type,entityFor(obj));if(e)seen.set(e.id,e.updated);}
function pushSheet(){if(!CAMPAIGN)return;if(isRepeatable())current().entries.forEach(o=>o.cid&&pushObj(o));else if(current().values.cid)pushObj(current().values);}
function blanks(obj){return !Object.entries(obj).some(([k,v])=>k!=='cid'&&v!==''&&v!=null);}
function shareSheet(){
 if(!CAMPAIGN)return status('The campaign store did not load. Reload the page and try again.');
 const s=current();let n=0,single='';
 if(isRepeatable())s.entries.forEach(o=>{if(blanks(o))return;if(!o.cid)o.cid=CAMPAIGN.makeId(type);pushObj(o);n++;single=o.name||'';});
 else{if(!s.values.cid)s.values.cid=CAMPAIGN.makeId(type);pushObj(s.values);n=1;single=title(s);}
 touch();render();
 status(n?`Shared ${n===1?`“${single}”`:`${n} entries from “${title(s)}”`} with the campaign. The Mission Board and Icon Spreads can see ${n===1?'it':'them'} now.`:'Give the sheet a name first. There is nothing to share yet.');
}
function fromEntity(e,kind){const o={cid:e.id};for(const [k,v] of Object.entries(e.data||{})){if(k==='bodies'||SHIP_TABLES.includes(k))continue;o[k]=v;}if(!o.name&&e.name)o.name=e.name;if(e.spread&&e.spread.reading)o[kind==='mission'?'reading':'spread']=e.spread.reading;return o;}
function importEntity(kind,id){
 if(!CAMPAIGN)return status('The campaign store did not load. Reload the page and try again.');
 const e=CAMPAIGN.get(kind,id);if(!e)return status('That entry is no longer in the campaign.');
 const s=current();
 if(isRepeatable()){
  const obj=fromEntity(e,kind),same=s.entries.find(o=>!o.cid&&o.name&&o.name===e.name),blank=s.entries.find(o=>blanks(o));
  if(same)Object.assign(same,obj);else if(blank)Object.assign(blank,obj);else{if(s.entries.length>=100)return status('Maximum 100 entries per sheet.');s.entries.push(obj);}
  touch();render();status(`Imported “${e.name||'the entry'}” from the campaign. It stays linked, so changes follow either way.`);
  return;
 }
 const next=newSheet(kind);
 next.values={...next.values,cid:e.id};
 for(const [k,v] of Object.entries(e.data||{})){if(k==='bodies'||SHIP_TABLES.includes(k))continue;next.values[k]=v;}
 if(kind==='system'&&Array.isArray(e.data.bodies))next.entries=structuredClone(e.data.bodies);
 if(kind==='ship')for(const k of SHIP_TABLES)if(Array.isArray(e.data[k]))next.tables[k]=structuredClone(e.data[k]);
 sheets.push(next);active=next.id;persist();render();
 status(`Imported “${e.name||'the entry'}” as a new ${TYPES[kind].toLowerCase()} sheet. It stays linked, so changes follow either way.`);
}
function targets(kind){if(kind!==type)return null;const s=current();return isRepeatable()?s.entries:s.values.cid?[s.values]:[];}
function applyEntity(obj,e,kind){
 let changed=false;const set=(k,v)=>{if(v===undefined||v===null)return;if(obj[k]!==v){obj[k]=v;changed=true;}};
 for(const [k,v] of Object.entries(e.data||{})){if(k==='bodies'||SHIP_TABLES.includes(k))continue;if(typeof v!=='string'&&typeof v!=='number'&&typeof v!=='boolean')continue;set(k,v);}
 if(e.name&&!Object.hasOwn(e.data||{},'name')&&obj.name!==e.name)set('name',e.name);
 if(e.spread&&e.spread.reading)set(kind==='mission'?'reading':'spread',e.spread.reading);
 if(kind==='system'&&Array.isArray(e.data.bodies)&&JSON.stringify(obj.bodies||[])!==JSON.stringify(e.data.bodies)){current().entries=structuredClone(e.data.bodies);changed=true;}
 if(kind==='ship')for(const k of SHIP_TABLES)if(Array.isArray(e.data[k])&&JSON.stringify(current().tables[k]||[])!==JSON.stringify(e.data[k])){current().tables[k]=structuredClone(e.data[k]);changed=true;}
 return changed;
}
function receive(db){
 if(!CAMPAIGN)return;let dirty=null;
 for(const kind of ['npc','mission','system','ship']){
  for(const [id,e] of Object.entries((db.entities&&db.entities[kind])||{})){
   if(e.writer===CAMPAIGN.WRITER||seen.get(id)===e.updated)continue;
   seen.set(id,e.updated);
   if(kind!==type)continue;
   const list=targets(kind);if(!list)continue;
   const obj=list.find(o=>o.cid===id);if(!obj)continue;
   if(applyEntity(obj,e,kind))dirty=e;
  }
 }
 if(dirty){current().updated=new Date().toISOString();persist();render();status(`Updated from the campaign: ${dirty.name||'a linked entry'}.`);}
}
function updateCampaign(){
 const box=$('#campaign');if(!box)return;
 const share=$('#campaign-share'),pick=$('#campaign-pick'),imp=$('#campaign-import'),unlink=$('#campaign-unlink'),backup=$('#campaign-backup');
 if(!CAMPAIGN){box.hidden=true;return;}
 box.hidden=false;
 const linked=isRepeatable()?current().entries.filter(o=>o.cid):current().values.cid?[current().values]:[];
 const pool=CAMPAIGN.all(type).filter(e=>!linked.some(o=>o.cid===e.id));
 pick.replaceChildren(el('option',{value:'',text:pool.length?`${CAMPAIGN.all(type).length} ${TYPES[type].toLowerCase()}${CAMPAIGN.all(type).length===1?'':'s'} in the campaign`:'Nothing shared yet'}),...pool.map(e=>el('option',{value:e.id,text:(e.name||'Unnamed')+` · ${e.source}`})));
 pick.disabled=!pool.length;imp.disabled=!pool.length;unlink.disabled=!linked.length;
 share.textContent=linked.length?'Update the campaign':isRepeatable()?'Share these entries':'Share this sheet';
 const total=CAMPAIGN.count(CAMPAIGN.read());
 $('#campaign-status').textContent=linked.length?`${linked.length} linked here · ${total} in the campaign.`:total?`Nothing from this sheet is shared yet · ${total} in the campaign.`:'The campaign is empty. Share a sheet to start it.';
}
const campaignCount=()=>(CAMPAIGN?CAMPAIGN.count(CAMPAIGN.read()):0);
function render(){const s=current();type=s.type;$('#types').replaceChildren(...Object.entries(TYPES).map(([t,name])=>el('button',{class:'btn quiet','aria-current':String(t===type),text:name,onclick:()=>switchType(t)})));updateLibrary();const ed=$('#editor'),grid=el('div',{class:'sheet-grid'});ed.dataset.sheetType=type;ed.replaceChildren(el('div',{class:'sheet-title'},el('div',{},el('div',{class:'eyebrow',text:'Coriolis · The Third Horizon'}),el('h2',{id:'sheet-heading',text:title(s)})),el('div',{class:'seal','aria-hidden':'true'},el('span',{text:'✦'}))),grid);
 if(type==='ship')grid.append(presetPicker('ship'));
 if(type==='character')character(grid);if(type==='ship')ship(grid);if(type==='system')system(grid);
 if(type==='mission'){grid.append(fieldset('Mission board',[F('name','Board name'),F('concept','Group concept',Object.values(CONCEPTS)),F('notes','Board notes','area')],s.values,true));repeats(grid,missionFields,'Mission');}
 if(type==='npc'){grid.append(fieldset('Cast of characters',[F('name','Collection name'),F('notes','Notes','area')],s.values,true));repeats(grid,npcFields,'NPC');}
 updateDerived();updateDataStatus();updateCampaign();requestAnimationFrame(()=>document.querySelectorAll('textarea').forEach(grow));}
function download(name,x){const url=URL.createObjectURL(new Blob([JSON.stringify(x,null,2)],{type:'application/json'})),a=el('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function backup(list){return {format:'coriolis-sheets-backup/1',saved:new Date().toISOString(),sheets:list};}
function readFile(callback){const input=$('#file');input.value='';input.onchange=async()=>{const f=input.files[0];if(!f)return;if(f.size>5*1024*1024)return status('Choose a JSON file smaller than 5 MB.');try{callback(JSON.parse(await f.text()));}catch(e){status(e.message||'Could not read that JSON file.');}};input.click();}
function updateDataStatus(){const relevant=['system','mission'].includes(type),prefix=type==='system'?'w.':type==='mission'?'task.':null;$('#generate').disabled=!relevant||!data||!Object.keys(data.tables).some(k=>k.startsWith(prefix));$('#data-status').textContent=data?`${data.name} · ${Object.keys(data.tables).length} tables · ${dataSource}.`:'No tables loaded. Import a table pack to generate missions and systems.';$('#generate').textContent=relevant?'Fill empty '+(type==='system'?'bodies':'missions'):'Choose System or Mission';}
$('#new').onclick=()=>{const s=newSheet(type);sheets.push(s);active=s.id;persist();render();};
$('#duplicate').onclick=()=>{const s=structuredClone(current());s.id=crypto.randomUUID();s.values.name=title(s)+' (copy)';sheets.push(s);active=s.id;persist();render();};
$('#library').onchange=e=>{active=e.target.value;persist();render();};
$('#export').onclick=()=>download('coriolis-sheet.json',backup([current()]));$('#backup').onclick=()=>download('coriolis-archive.json',backup(sheets));
$('#restore').onclick=()=>readFile(x=>{const imported=validateArchive(x);if(sheets.length+imported.length>500)throw Error('Maximum 500 sheets per archive.');sheets.push(...imported);active=imported[0].id;type=imported[0].type;persist();render();status(`Imported ${imported.length} sheets. Existing sheets kept.`);});
$('#delete').onclick=()=>$('#confirm').showModal();$('#confirm').addEventListener('close',()=>{if($('#confirm').returnValue!=='delete')return;sheets=sheets.filter(s=>s.id!==active);let next=sheets.find(s=>s.type===type);if(!next){next=newSheet(type);sheets.push(next);}active=next.id;persist();render();});
$('#print').onclick=()=>{document.querySelectorAll('textarea').forEach(grow);window.print();};
$('#import-tables').onclick=()=>readFile(x=>{const next=validateData(x);try{localStorage.setItem(DATAKEY,JSON.stringify(next));}catch{throw Error('Could not save the tables. Browser storage is unavailable or full.');}data=next;dataSource='visitor import';updateDataStatus();status('Tables imported in this browser. Launch data is unchanged.');});
$('#default-tables').onclick=async()=>{try{localStorage.removeItem(DATAKEY);await loadDefault();status('Using launch tables.');}catch(e){status(e.message);}};
$('#template').onclick=()=>download('coriolis-tables-template.json',{format:FORMAT,name:'My campaign tables',tables:{'w.hook':{dice:'D66',rows:[{lo:11,hi:66,n:'An abandoned listening station',d:'Its beacon has started transmitting again.'}]},'task.agents':{dice:'D66',rows:[{lo:11,hi:66,n:'Recover a missing courier',d:'Follow the courier’s last transmission.'}]}}});
$('#generate').onclick=()=>{try{const g=generator(data),s=current(),concept=Object.keys(CONCEPTS).find(k=>CONCEPTS[k]===s.values.concept)||'agents';const patches=s.entries.map(obj=>type==='system'?g.world(obj.kind||'Planet'):g.mission(concept));let filled=0;patches.forEach((patch,i)=>{for(const [k,v] of Object.entries(patch))if(s.entries[i][k]==null||s.entries[i][k]===''){s.entries[i][k]=v;filled++;}});s.values.rollLog=(s.values.rollLog?s.values.rollLog+'\n\n':'')+new Date().toISOString()+'\n'+g.log.join('\n');touch();render();status(`Filled ${filled} empty fields. Existing entries kept. Roll details are saved in the sheet export.`);}catch(e){status(e.message+' No sheet fields were changed.');}};
async function loadDefault(){const response=await fetch('./data/launch-tables.json');if(!response.ok)throw Error('Launch tables could not be loaded. You can import a local table pack.');data=validateData(await response.json());dataSource='launch data';updateDataStatus();}
const theme=$('#theme');try{theme.value=localStorage.getItem(THEMEKEY)||'auto';}catch{}function setTheme(){if(theme.value==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=theme.value;}setTheme();theme.onchange=()=>{setTheme();try{localStorage.setItem(THEMEKEY,theme.value);}catch{}};
try{const r=await fetch('./data/presets.json');if(r.ok)presets=await r.json();}catch{}
if(CAMPAIGN){
 $('#campaign-share').onclick=shareSheet;
 $('#campaign-import').onclick=()=>{const id=$('#campaign-pick').value;if(!id)return status('Choose something from the campaign first.');importEntity(type,id);};
 $('#campaign-unlink').onclick=()=>{const linked=isRepeatable()?current().entries.filter(o=>o.cid):current().values.cid?[current().values]:[];if(!linked.length)return status('Nothing on this sheet is linked to the campaign.');linked.forEach(o=>delete o.cid);touch();render();status('Unlinked here. The campaign keeps its own copies, and the other tools still see them.');};
 $('#campaign-backup').onclick=()=>download('ctth-campaign.json',CAMPAIGN.exportAll());
 CAMPAIGN.subscribe(receive);
}
render();if(startupError)status(startupError);else persist();
if(CAMPAIGN)receive(CAMPAIGN.read());
try{const imported=localStorage.getItem(DATAKEY);if(imported){data=validateData(JSON.parse(imported));dataSource='visitor import';updateDataStatus();}else await loadDefault();}catch(e){status(e.message);try{await loadDefault();}catch{updateDataStatus();}}
