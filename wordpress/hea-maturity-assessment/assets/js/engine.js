(function(root){
'use strict';
const GROUPS=[[0,1,2],[3,4,5,6],[7,8,9,10],[11,12,13],[14,15,16]];
function halfDown(total,count){return Math.max(1,Math.min(5,Math.floor((2*total+count-1)/(2*count))));}
function complete(values){
 const total=values.reduce((a,b)=>a+b,0), lowest=Math.min(...values), initial=halfDown(total,values.length), ceiling=Math.min(5,lowest+1);
 return {total,count:values.length,lowest,initial,ceiling,level:Math.min(initial,ceiling),ceilingApplied:ceiling<initial};
}
function calculate(answers){
 if(!Array.isArray(answers)||answers.length!==17||Array.from(answers).some(a=>a!==null&&(!Number.isInteger(a)||a<1||a>5)))throw new Error('Select one valid answer for each of the 17 questions.');
 const dimensions=GROUPS.map((indices,index)=>{
  const values=indices.map(i=>answers[i]), unknowns=indices.filter(i=>answers[i]===null), lower=complete(values.map(v=>v===null?1:v)), upper=complete(values.map(v=>v===null?5:v));
  return {index,indices,unknowns,complete:unknowns.length===0,score:unknowns.length?null:lower,lowerLevel:lower.level,upperLevel:upper.level};
 });
 const lowerLevel=Math.min(...dimensions.map(d=>d.lowerLevel)),upperLevel=Math.min(...dimensions.map(d=>d.upperLevel));
 const full=dimensions.every(d=>d.complete);
 const state=full?'complete':lowerLevel===upperLevel?'confirmed-partial':lowerLevel===1&&upperLevel===5?'insufficient-visibility':'range';
 const level=lowerLevel===upperLevel?lowerLevel:null;
 const constraints=full?dimensions.filter(d=>d.score.level===level).map(d=>d.index):[];
 const possibleConstraints=full?constraints:dimensions.filter(d=>d.lowerLevel<=upperLevel).map(d=>d.index);
 const risks=answers.flatMap((v,i)=>v===1?[i]:[]);
 const unknowns=answers.flatMap((v,i)=>v===null?[i]:[]);
 const gaps=dimensions.flatMap(d=>d.complete&&d.score.ceilingApplied?d.indices.filter(i=>answers[i]===d.score.lowest):[]);
 return {state,level,lowerLevel,upperLevel,dimensions,constraints,possibleConstraints,risks,gaps,unknowns};
}
const api={GROUPS,halfDown,complete,calculate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HEA_ENGINE=api;
})(typeof window!=='undefined'?window:globalThis);
