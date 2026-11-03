import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {simpleCatalog} from '../simple-astra/catalog.mjs';
import {plainCatalog} from '../simple-astra/plain-catalog.mjs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8'),sha=text=>createHash('sha256').update(text).digest('hex');
export function strongerCatalogs(){
 const original=simpleCatalog(),plain=plainCatalog(),protocol=JSON.parse(read('protocol.json')),records=JSON.parse(read('recorded.json'));
 if(records.length!==111)throw Error('Stronger generation incomplete: '+records.length+'/111');
 function steps(id,first){
  const start=protocol.starts.find(item=>item.id===id);if(!start||first.sha256!==start.sha256||sha(first.fullPrompt)!==start.briefSha256)throw Error('Changed starting design: '+id);
  const result=[first],prompt=id==='plain'?protocol.plainPrompt:protocol.prompt;
  for(let stage=2;stage<=4;stage++){
   const sourceFile=`${id}-${stage}.html`,record=records.find(item=>item.file===sourceFile),html=read('runs/'+sourceFile),critique=read(`runs/${id}-critique-${stage-1}.txt`);
   if(!record||sha(html)!==record.sha256||sha(critique)!==record.critiqueSha256||sha(prompt)!==record.promptSha256||result.at(-1).sha256!==record.predecessorSha256)throw Error('Changed saved stronger result: '+sourceFile);
   result.push({file:'stronger-'+sourceFile,html,critique,prompt,fullPrompt:prompt,sha256:record.sha256});
  }
  return result;
 }
 return {
  experiment:{...original,runs:original.runs.map(run=>({...run,steps:steps(run.id,run.steps[0])})),refinementPrompt:protocol.prompt,setup:protocol.setup,protocol:{...protocol,artifacts:records.filter(record=>!record.file.startsWith('plain-'))}},
  baseline:{steps:steps('plain',plain.steps[0]),protocol:{...protocol,refinementPrompt:protocol.plainPrompt,artifacts:records.filter(record=>record.file.startsWith('plain-'))}}
 };
}
