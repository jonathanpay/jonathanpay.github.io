export const TYPES={character:'Character',ship:'Spaceship',system:'System',mission:'Mission',npc:'NPC'};
export const CONCEPTS={agents:'Agents',mercenaries:'Mercenaries',explorers:'Explorers',pilgrims:'Pilgrims',entertainers:'Pilgrims: entertainers',nomads:'Pilgrims: nomads / plebeians',traders:'Free traders'};
// Fields: key, label, control type (or list of options).
const f=(key,label=key,type='text')=>[key,label,type];
export const identity=[f('name','Name'),f('background','Background'),f('concept','Concept'),f('icon','Icon'),f('groupConcept','Group concept'),f('reputation','Reputation','number'),f('problem','Personal problem','area')];
export const attributes=['strength','agility','wits','empathy'].map(k=>f(k,k[0].toUpperCase()+k.slice(1),'number'));
export const skills=['Dexterity (Agility)','Force (Strength)','Infiltration (Agility)','Manipulation (Empathy)','Melee combat (Strength)','Observation (Wits)','Ranged combat (Agility)','Survival (Wits)','Command (Empathy)','Culture (Empathy)','Data djinn (Wits)','Medicurgy (Wits)','Mystic powers (Empathy)','Pilot (Agility)','Science (Wits)','Technology (Wits)'].map((s,i)=>f('skill'+i,s,'number'));
export const bodyFields=[f('name','Body name'),f('kind','Body type',['Planet','Gas giant','Asteroid belt']),f('distance','Distance from star (AD)','number'),f('size','Size'),f('atmosphere','Atmosphere'),f('geosphere','Geosphere / composition'),f('temperature','Temperature'),f('orbit','In orbit','area'),f('population','Population'),f('spaceport','Spaceport'),f('factions','Factions','area'),f('other','Other / characteristics','area'),f('hooks','Scenario hooks','area')];
export const missionFields=[f('name','Mission'),f('destination','Destination'),f('employer','Employer'),f('reward','Reward','area'),f('information','Information','area'),f('complications','Complications','area'),f('reading','Icon reading','area')];
export const npcFields=[f('name','Name'),f('concept','Concept'),f('appearance','Appearance','area'),f('icon','Icon'),f('reputation','Reputation','number'),...attributes,f('hp','Hit points taken','number'),f('mp','Stress points taken','number'),f('skills','Skills','area'),f('talents','Talents','area'),f('equipment','Equipment','area'),f('weapons','Weapons · skill / init / damage / crit','area'),f('spread','Icon spread','area')];
export function newSheet(type){return {id:crypto.randomUUID(),type,values:type==='mission'?{concept:'Agents'}:{},tables:{},entries:type==='system'?Array.from({length:4},()=>({kind:'Planet'})):type==='mission'?Array.from({length:4},()=>({})):type==='npc'?Array.from({length:3},()=>({})):[],updated:new Date().toISOString()};}
export const FORMAT='coriolis-sheets-data/1';
const safeKeys=/^[a-zA-Z][a-zA-Z0-9.]*$/;
export function validateData(x){
 if(!x||![FORMAT,'mission-board-data/1'].includes(x.format)||!x.tables||typeof x.tables!=='object'||Array.isArray(x.tables))throw Error('Choose a Coriolis Sheets or Mission Board table data file.');
 const tables={};
 for(const [id,t] of Object.entries(x.tables)){
  if(!safeKeys.test(id)||['constructor','prototype'].includes(id))throw Error('Invalid table ID.');
  if(!t||!Array.isArray(t.rows)||!t.rows.length||t.rows.length>500)throw Error(`Table ${id} needs 1–500 rows.`);
  const dice=t.dice|| (id==='w.beltSize'||id==='w.beltComp'||id==='w.factionCount'?'D6':id.startsWith('w.')&&id!=='w.hook'?'2D6':'D66');
  if(!['D6','2D6','D66'].includes(dice))throw Error(`Unsupported dice in ${id}.`);
  const rows=t.rows.map(r=>{if(!r||!Number.isInteger(r.lo)||!Number.isInteger(r.hi)||r.lo>r.hi||typeof r.n!=='string'||r.n.length>20000||(r.d!=null&&typeof r.d!=='string'))throw Error(`Invalid row in ${id}.`);return {lo:r.lo,hi:r.hi,n:r.n,d:r.d||'',...(r.count!=null?{count:r.count}:{})};}).sort((a,b)=>a.lo-b.lo);
  for(let i=1;i<rows.length;i++)if(rows[i].lo<=rows[i-1].hi)throw Error(`Overlapping rows in ${id}.`);
  tables[id]={dice,rows};
 }
 return {format:FORMAT,name:typeof x.name==='string'?x.name:'Imported tables',tables};
}
const scalar=x=>typeof x==='string'||typeof x==='boolean'||(typeof x==='number'&&Number.isFinite(x));
const record=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.entries(x).every(([k,v])=>/^[a-zA-Z][a-zA-Z0-9]*$/.test(k)&&!['constructor','prototype'].includes(k)&&scalar(v));
export function validateArchive(x){
 if(!x||x.format!=='coriolis-sheets-backup/1'||!Array.isArray(x.sheets)||!x.sheets.length||x.sheets.length>500)throw Error('Choose a Coriolis Sheets backup or exported sheet.');
 return x.sheets.map(s=>{
 if(!s||!Object.hasOwn(TYPES,s.type)||!record(s.values)||!s.tables||typeof s.tables!=='object'||Array.isArray(s.tables)||!Array.isArray(s.entries)||s.entries.length>100||!s.entries.every(record))throw Error('The backup contains an invalid sheet.');
 for(const [k,rows] of Object.entries(s.tables))if(!/^[a-zA-Z]+$/.test(k)||['constructor','prototype'].includes(k)||!Array.isArray(rows)||rows.length>100||!rows.every(record))throw Error('Invalid sheet table.');
 return {...newSheet(s.type),values:structuredClone(s.values),tables:structuredClone(s.tables),entries:structuredClone(s.entries)};
 });
}
export const d6=()=>1+Math.floor(Math.random()*6);
export function roll(expr){if(expr==='D66')return d6()*10+d6();const m=/^(\d*)D6(?:\+(\d+))?$/.exec(expr);if(!m)throw Error('Invalid dice expression');return Array.from({length:+m[1]||1},d6).reduce((a,b)=>a+b,0)+(+m[2]||0);}
export function lookup(table,r){const rows=table.rows;return rows.find(x=>r>=x.lo&&r<=x.hi)|| (r<rows[0].lo?rows[0]:r>rows.at(-1).hi?rows.at(-1):null);}
export function generator(data){
 const log=[];
 function on(id,mod=0,dice,forced){const t=data.tables[id];if(!t)throw Error(`Missing table: ${id}. Import a complete table pack.`);const raw=forced??roll(dice||t.dice),r=raw+mod,row=lookup(t,r);if(!row)throw Error(`No matching row in ${id} for ${r}.`);log.push(`${id}: ${raw}${mod?` (${mod>0?'+':''}${mod})`:''} → ${row.n}`);return {...row,r};}
 const text=r=>r.n+(r.d?' — '+r.d:'');
 const portMod=p=>p<=3?-8:p<=5?-6:p<=7?-4:p<=9?0:p<=11?1:4;
 function world(kind){
 const v={}, gas=kind==='Gas giant',belt=kind==='Asteroid belt';let size,atmo,temp,pop;
 if(gas){v.size=text(on('w.gasSize'));v.atmosphere='Toxic';v.temperature=text(on('w.gasTemp'));v.other=[text(on('w.gasColour')),text(on('w.gasChar')),`${roll('3D6')} moons`].join('\n');}
 else if(belt){v.size=text(on('w.beltSize'));v.geosphere=text(on('w.beltComp'));v.other=text(on('w.beltChar'));}
 else{size=on('w.size');v.size=text(size);atmo=size.r<=3?on('w.atmosphere',0,undefined,roll('D6')<=3?2:3):on('w.atmosphere');v.atmosphere=text(atmo);if(atmo.r===12)v.other='Special atmosphere: temperature and geosphere modifiers are left at 0 for the GM to adjust.';temp=on('w.temperature',({9:1,10:6,11:6})[atmo.r]||0);v.temperature=text(temp);v.geosphere=text(on('w.geosphere',(({3:-4,9:-4,10:-4,11:-4})[atmo.r]||0)+(temp.r>=12?-4:temp.r>=10?-2:0)));}
 if(!belt){const orbit=on('w.orbit');v.orbit=orbit.r===2?Array.from({length:roll('D6')},()=>{let o=on('w.orbit');for(let i=0;o.r===2&&i<20;i++)o=on('w.orbit');return text(o);}).join('\n'):text(orbit);}
 pop=on('w.population',belt||(size&&size.r<=3)?-4:0,gas?'D6':undefined);v.population=text(pop);v.spaceport=text(on('w.spaceport',portMod(pop.r)));v.hooks=text(on('w.hook'));
 const fc=on('w.factionCount'),count=fc.count!=null?(typeof fc.count==='number'?fc.count:roll(fc.count)):fc.r===1?1:fc.r<=4?2:fc.r===5?3:roll('D6');
 const factions=[];for(let i=0;i<Math.min(6,count);i++){let f=on('w.faction');for(let j=0;factions.some(x=>x.n===f.n)&&j<30;j++)f=on('w.faction');factions.push(f);}v.factions=text(fc)+'\n'+factions.map((f,i)=>text(f)+(fc.r===6?` (strength ${roll('D6')})`:fc.r===4?i===0?' (dominant)':' (weak)':'')).join('\n');
 return v;
 }
 function mission(concept){
 const type=on('mission.type'), meta=type.d.split('|').map(x=>x.trim());
 if(meta.length!==5)throw Error('mission.type needs destination | complications | base reward dice | extra rewards | difficulty in its description.');
 const [dest,comp,base,extra,diff]=meta,task=on('task.'+concept),employer=on('employer.'+concept),location=on('location.'+(['pilgrims','entertainers','nomads'].includes(concept)?'agents':concept));
 const rewards=[`${roll(base)*1000} birr`];for(let i=0;i<Math.min(6,+extra);i++){const r=on('reward.'+concept);rewards.push(text(r)+(r.n.toLowerCase()==='birr'?` (${roll(diff==='Difficult'?'3D6':diff==='Normal'?'2D6':'D6')*1000} birr)` :''));}
 return {name:task.n,employer:text(employer),destination:dest+' · '+text(location),reward:rewards.join('\n'),information:`${diff} · ${CONCEPTS[concept]}\n${task.d||task.n}`,complications:Array.from({length:Math.min(6,+comp)},()=>text(on('complication.'+concept))).join('\n')||'None'};
 }
 return {world,mission,log};
}
