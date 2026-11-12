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
constants.CURATION={showcase:(Array.isArray(curation.showcase)?curation.showcase:[]).map(entry=>({pair:String(entry.pair??entry),reason:String(entry.reason??'')})).filter(entry=>pairIds.has(entry.pair))};
const payload=Object.entries(constants).map(([name,value])=>'const '+name+'='+JSON.stringify(value).replace(/</g,'\\u003c')+';').join('\n');
const javascript=(payload+'\n'+read('dice-math.js')+'\n'+read('dice.js')+'\n'+read('dice-interaction.js')+'\n'+read('dice-sound.js')+'\n'+read('prompt-peek.js')+'\n'+read('report-handoff.js')+'\n'+read('play.js')+'\n'+read('demo.js')).replace(/<\/script/gi,'<\\/script');
const html=read('play.html').replace('/* SHELL_CSS */',read('shell.css')+'\n'+read('play.css')).replace('/* APP_JS */',()=>javascript);
const output=new URL('../../outputs/',import.meta.url);mkdirSync(output,{recursive:true});
writeFileSync(new URL('index.html',output),html);
console.log('Built '+fileURLToPath(new URL('index.html',output))+` — plain trajectory, ${experiment.runs.length} ingredient pairs, immediate results, tactile dice.`);
