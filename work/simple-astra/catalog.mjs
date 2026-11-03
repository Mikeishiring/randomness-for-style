import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dataset,firstPrompt,filledPrompt,refinementPrompt,ingredientsA,ingredientsB} from './prompts.mjs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
export function simpleCatalog(){
 const protocol=JSON.parse(read('protocol.json'));
 const snapshot=(id,stage,a,b)=>{
  const file=id+'-'+stage+'.html',html=read('runs/'+file),record=protocol.artifacts.find(item=>item.file===file);
  if(!record||record.sha256!==sha(html))throw Error('Unfrozen or changed snapshot: '+file);
  const prompt=stage===1?firstPrompt(a,b):refinementPrompt,fullPrompt=stage===1?filledPrompt(a,b):refinementPrompt;
  const critique=stage===1?'':read(`runs/${id}-critique-${stage-1}.txt`);
  if(record.promptSha256!==sha(fullPrompt))throw Error('Prompt mismatch: '+file);
  if(stage>1&&record.critiqueSha256!==sha(critique))throw Error('Critique mismatch: '+file);
  return {file,html,prompt,fullPrompt,critique,sha256:record.sha256};
 };
 const runs=ingredientsA.flatMap((name,a)=>ingredientsB.map((other,b)=>{
  const id=`${a}-${b}`,count=protocol.artifacts.filter(item=>item.file.startsWith(id+'-')).length;
  return {id,a,b,label:`${name} × ${other}`,steps:Array.from({length:count},(_,n)=>snapshot(id,n+1,a,b))};
 }));
 return {model:protocol.model,dataset,runs,plain:snapshot('plain',1,null,null),refinementPrompt,setup:protocol.setup,protocol};
}
