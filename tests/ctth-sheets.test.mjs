import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateData,validateArchive,generator,CONCEPTS,lookup} from '../tools/ctth-sheets/model.js';
const pack=JSON.parse(readFileSync(new URL('../tools/ctth-sheets/data/launch-tables.json',import.meta.url)));
const presets=JSON.parse(readFileSync(new URL('../tools/ctth-sheets/data/presets.json',import.meta.url)));
const data=validateData(pack);
function fixedRandom(value,fn){const old=Math.random;Math.random=()=>value;try{return fn();}finally{Math.random=old;}}
test('launch tables have exactly one row for every possible unmodified roll',()=>{
 for(const [id,t] of Object.entries(data.tables)){
 const values=t.dice==='D66'?Array.from({length:36},(_,i)=>(Math.floor(i/6)+1)*10+i%6+1):Array.from({length:t.dice==='D6'?6:11},(_,i)=>i+(t.dice==='D6'?1:2));
 for(const v of values)assert.equal(t.rows.filter(r=>v>=r.lo&&v<=r.hi).length,1,`${id}: ${v}`);
 assert.ok(lookup(t,-999));assert.ok(lookup(t,999));
 }
});
test('all seven group concepts generate at both dice extremes',()=>{
 for(const c of Object.keys(CONCEPTS))for(const random of [0,.999])fixedRandom(random,()=>{
 const m=generator(data).mission(c);assert.ok(m.name);assert.ok(m.employer);assert.ok(m.information.includes(CONCEPTS[c]));
 if(random===0){assert.match(m.reward,/1000 birr/);assert.equal(m.complications,'None');}
 else{assert.match(m.reward,/34000 birr/);assert.equal(m.complications.split('\n').length,3);assert.equal(m.reward.split('\n').length,3);}
 });
});
test('small worlds, gas giants and belts apply their population rules',()=>{
 fixedRandom(0,()=>{const w=generator(data).world('Planet');assert.match(w.atmosphere,/Toxic/);assert.match(w.population,/Uninhabited/);assert.match(w.spaceport,/Primitive/);});
 fixedRandom(.999,()=>{const w=generator(data).world('Planet');assert.match(w.temperature,/Burning/);assert.match(w.geosphere,/Earth-like/);});
 fixedRandom(.999,()=>{const w=generator(data).world('Gas giant');assert.match(w.other,/18 moons/);assert.match(w.population,/few thousand/);});
 fixedRandom(0,()=>{const w=generator(data).world('Asteroid belt');assert.match(w.population,/Uninhabited/);assert.ok(!('atmosphere' in w));});
});
test('invalid imports reject overlaps and unsafe keys before use',()=>{
 const bad=structuredClone(pack);bad.tables['w.size'].rows[1].lo=2;assert.throws(()=>validateData(bad),/Overlapping/);
 assert.throws(()=>validateData({format:pack.format,tables:{constructor:{rows:[{lo:1,hi:6,n:'test'}]}}}),/Invalid table ID/);
 assert.throws(()=>validateArchive({format:'coriolis-sheets-backup/1',sheets:[{type:'constructor'}]}),/invalid sheet/);
});
test('source interpretations remain unambiguous at overlapping printed ranges',()=>{
 assert.equal(lookup(data.tables['location.explorers'],63).n,'Spaceship');
 assert.match(lookup(data.tables['location.explorers'],64).n,/wonders/);
 assert.equal(lookup(data.tables['reward.traders'],63).n,'Extra debt cancellation');
 assert.equal(lookup(data.tables['reward.traders'],64).n,'Artifact');
});
test('NPC and ship presets retain their supplied baseline stats',()=>{
 assert.equal(presets.npcs.length,11);assert.equal(presets.ships.length,17);
 const soldier=presets.npcs.find(x=>x.label==='Soldier').values;assert.equal(soldier.agility,5);assert.match(soldier.skills,/Ranged combat 3/);
 const scarab=presets.ships[0];assert.equal(scarab.values.hull,6);assert.equal(scarab.values.energy,5);assert.equal(scarab.tables.modules.length,10);
 const destroyer=presets.ships.find(x=>x.label==='Destroyer');assert.equal(destroyer.values.armour,8);assert.equal(destroyer.tables.modules.filter(x=>x.name==='Accelerator cannon').length,2);
});
test('the public launch pack carries names only, apart from numeric mechanics',()=>{
 const numeric=new Set(['mission.type','w.spaceport']);
 for(const [id,t] of Object.entries(pack.tables))if(!numeric.has(id))for(const r of t.rows)assert.ok(!('d' in r),`${id} row ${r.lo} has a description`);
 for(const r of pack.tables['mission.type'].rows)assert.match(r.d,/^[^|]+\|\s*\d+\s*\|[^|]+\|\s*\d+\s*\|[^|]+$/);
});
