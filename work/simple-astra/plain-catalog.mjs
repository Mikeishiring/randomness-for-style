import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {firstPrompt,filledPrompt} from './prompts.mjs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8'),sha=value=>createHash('sha256').update(value).digest('hex');
export function plainCatalog(){
 const protocol=JSON.parse(read('plain-protocol.json'));
 const steps=protocol.artifacts.map((record,index)=>{
  const html=read('runs/'+record.file),critique=index?read(`runs/plain-critique-${index}.txt`):'',prompt=index?protocol.refinementPrompt:firstPrompt(null,null),fullPrompt=index?prompt:filledPrompt(null,null);
  if(record.sha256!==sha(html)||record.promptSha256!==sha(fullPrompt)||(index&&record.critiqueSha256!==sha(critique)))throw Error('Plain snapshot mismatch: '+record.file);
  return {file:record.file,html,critique,prompt,fullPrompt,sha256:record.sha256};
 });
 return {steps,protocol};
}
