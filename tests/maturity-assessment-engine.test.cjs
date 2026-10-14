const assert=require('node:assert/strict');
const E=require('./engine.js'),D=require('./data.js');
assert.equal(D.questions.length,17);assert.equal(D.context.length,3);
assert.ok(D.questions.every(q=>q.options.length===6));assert.equal(D.obstacles.length,9);
for(const [sum,n,expect] of [[6,4,1],[10,4,2],[14,4,3],[18,4,4],[20,4,5],[8,3,3],[11,3,4]])assert.equal(E.halfDown(sum,n),expect);
assert.equal(E.complete([1,5,5,5]).level,2);assert.equal(E.complete([2,5,5,5]).level,3);assert.equal(E.complete([3,5,5,5]).level,4);
const all=E.calculate(Array(17).fill(5));assert.equal(all.level,5);assert.deepEqual(all.constraints,[0,1,2,3,4]);
const none=E.calculate(Array(17).fill(null));assert.equal(none.state,'insufficient-visibility');assert.ok(none.dimensions.every(d=>d.score===null));
let a=[3,3,3,3,2,null,null,3,3,2,2,2,2,3,3,3,2];let p=E.calculate(a);assert.equal(p.state,'confirmed-partial');assert.equal(p.level,2);assert.equal(p.dimensions[1].score,null);
a[3]=1;p=E.calculate(a);assert.equal(p.state,'range');assert.equal(p.lowerLevel,1);assert.equal(p.upperLevel,2);
a=Array(17).fill(5);a[3]=1;p=E.calculate(a);assert.equal(p.level,2);assert.deepEqual(p.risks,[3]);assert.deepEqual(p.gaps,[3]);
// All partial patterns: compare endpoint calculation against independent enumeration.
function combinations(n,values){return n===0?[[]]:combinations(n-1,values).flatMap(a=>values.map(v=>[...a,v]));}
function independent(v){const avg=v.reduce((a,b)=>a+b,0)/v.length;let initial=1;for(const cut of [1.5,2.5,3.5,4.5])if(avg>cut)initial++;return Math.min(initial,Math.min(...v)+1,5);}
let patterns=0;
for(const n of [3,4])for(const v of combinations(n,[null,1,2,3,4,5])){
 const missing=v.map((x,i)=>x===null?i:-1).filter(i=>i>=0);
 const outcomes=combinations(missing.length,[1,2,3,4,5]).map(fills=>{const full=v.slice();missing.forEach((idx,j)=>full[idx]=fills[j]);return independent(full);});
 assert.equal(E.complete(v.map(x=>x===null?1:x)).level,Math.min(...outcomes));
 assert.equal(E.complete(v.map(x=>x===null?5:x)).level,Math.max(...outcomes));patterns++;
}
// Equal final levels create joint constraints even with different exact means.
a=[3,3,2,3,3,3,3,4,4,4,4,3,3,3,4,4,4];p=E.calculate(a);assert.deepEqual(p.constraints,[0,1,3]);
assert.throws(()=>E.calculate(new Array(17)));assert.throws(()=>E.calculate(Array(16).fill(1)));assert.throws(()=>E.calculate(Array(17).fill(0)));assert.throws(()=>E.calculate(Array(17).fill(undefined)));
console.log(`PASS: exact-half boundaries, ceilings, joint final-level constraints, unknown states, flags and ${patterns} partial-pattern bounds.`);
