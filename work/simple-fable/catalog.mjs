import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dataset,firstPrompt,filledPrompt,refinementPrompt,plainRefinementPrompt,ingredientsA,ingredientsB} from './prompts.mjs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
export function fableCatalogs(){
 const protocol=JSON.parse(read('protocol.json'));
 const snapshot=(id,stage,a,b)=>{
  const file=id+'-'+stage+'.html',html=read('runs/'+file),record=protocol.artifacts.find(item=>item.file===file);
  if(!record||record.sha256!==sha(html))throw Error('Unfrozen or changed snapshot: '+file);
  const refine=id==='plain'?plainRefinementPrompt:refinementPrompt;
  const prompt=stage===1?firstPrompt(a,b):refine,fullPrompt=stage===1?filledPrompt(a,b):refine;
  const critique=stage===1?'':read(`runs/${id}-critique-${stage-1}.txt`);
  if(record.promptSha256!==sha(fullPrompt))throw Error('Prompt mismatch: '+file);
  if(stage>1&&record.critiqueSha256!==sha(critique))throw Error('Critique mismatch: '+file);
  return {file:'newer-'+file,html,prompt,fullPrompt,critique,sha256:record.sha256};
 };
 const steps=(id,a,b)=>{
  const result=Array.from({length:4},(_,n)=>snapshot(id,n+1,a,b));
  for(let stage=2;stage<=4;stage++){
   const record=protocol.artifacts.find(item=>item.file===`${id}-${stage}.html`);
   if(record.predecessorSha256!==result[stage-2].sha256)throw Error('Broken lineage: '+id+'-'+stage);
  }
  return result;
 };
 const runs=ingredientsA.flatMap((name,a)=>ingredientsB.map((other,b)=>({id:`${a}-${b}`,a,b,label:`${name} × ${other}`,steps:steps(`${a}-${b}`,a,b)})));
 return {
  experiment:{model:protocol.model,dataset,runs,plain:snapshot('plain',1,null,null),refinementPrompt,setup:protocol.setup,protocol},
  baseline:{steps:steps('plain',null,null),protocol:{refinementPrompt:plainRefinementPrompt,artifacts:protocol.artifacts.filter(record=>record.file.startsWith('plain-'))}}
 };
}
