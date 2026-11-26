import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ingredientsA,ingredientsB} from '../simple-astra/prompts.mjs';
import {simpleCatalog} from '../simple-astra/catalog.mjs';
import {plainCatalog} from '../simple-astra/plain-catalog.mjs';
import {strongerCatalogs} from '../strong-astra/catalog.mjs';
import {fableCatalogs} from '../simple-fable/catalog.mjs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const experiment=simpleCatalog();
const stronger=strongerCatalogs();
const newer=fableCatalogs();
// Generation records remain in the workspace; the viewer needs only its examples and prompts.
const publicExperiment=({runs,plain,refinementPrompt})=>({runs,plain,refinementPrompt});
const publicBaseline=({steps,protocol})=>({steps,protocol:{refinementPrompt:protocol.refinementPrompt}});
const constants={EXPERIMENT:publicExperiment(experiment),INGREDIENTS_A:ingredientsA,INGREDIENTS_B:ingredientsB,BASELINE:publicBaseline(plainCatalog()),STRONGER_EXPERIMENT:publicExperiment(stronger.experiment),STRONGER_BASELINE:publicBaseline(stronger.baseline),NEWER_EXPERIMENT:publicExperiment(newer.experiment),NEWER_BASELINE:publicBaseline(newer.baseline)};
// Curated showcase pairs guide a visitor's first roll; without curation.json the first roll stays random.
const curationFile=new URL('curation.json',import.meta.url),curation=existsSync(curationFile)?JSON.parse(read('curation.json')):{};
const pairIds=new Set(experiment.runs.map(run=>run.id));
const picks=Object.fromEntries(['original','stronger','newer'].map(track=>[track,Object.fromEntries(Object.entries(curation[track]||{}).filter(([id,entry])=>pairIds.has(id)&&Number.isInteger(entry?.pick)).map(([id,entry])=>[id,{pick:entry.pick,reason:String(entry.reason??'')}]))]));
constants.CURATION={picks,showcase:(Array.isArray(curation.showcase)?curation.showcase:[]).map(entry=>({pair:String(entry.pair??entry),reason:String(entry.reason??'')})).filter(entry=>pairIds.has(entry.pair))};
// Pair reports and their critiques move to a store sent in a second script, so the opening page does not wait
// for them. Identical texts (a pass that changed nothing) are stored once.
const storedKeys=new Map(),reports={};
const store=text=>{if(!storedKeys.has(text)){storedKeys.set(text,storedKeys.size);reports[storedKeys.size-1]=text;}return storedKeys.get(text);};
for(const name of ['EXPERIMENT','STRONGER_EXPERIMENT','NEWER_EXPERIMENT'])constants[name]={...constants[name],runs:constants[name].runs.map(run=>({...run,steps:run.steps.map(({html,critique,...step})=>({...step,stored:{html:store(html),critique:store(critique)}}))}))};
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const payload=Object.entries(constants).map(([name,value])=>'const '+name+'='+json(value)+';').join('\n')+'\n'+read('report-store.js');
const javascript=(payload+'\n'+read('dice-math.js')+'\n'+read('dice.js')+'\n'+read('dice-interaction.js')+'\n'+read('dice-sound.js')+'\n'+read('prompt-peek.js')+'\n'+read('report-handoff.js')+'\n'+read('play.js')+'\n'+read('demo.js')).replace(/<\/script/gi,'<\\/script');
const html=read('play.html').replace('/* SHELL_CSS */',read('shell.css')+'\n'+read('play.css')).replace('/* APP_JS */',()=>javascript).replace('/* REPORTS_JS */',()=>('receiveReports('+json(reports)+');').replace(/<\/script/gi,'<\\/script'));
const output=new URL('../../outputs/',import.meta.url);mkdirSync(output,{recursive:true});
writeFileSync(new URL('index.html',output),html);
console.log('Built '+fileURLToPath(new URL('index.html',output))+` — plain trajectory, ${experiment.runs.length} ingredient pairs, immediate results, tactile dice.`);
