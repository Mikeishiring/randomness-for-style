import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {plainCatalog} from '../simple-astra/plain-catalog.mjs';
import {ingredientsA,ingredientsB,filledPrompt,firstPrompt,refinementPrompt,dataset} from '../simple-astra/prompts.mjs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const baseline=plainCatalog();
const snapshot=(a,b,n)=>({html:`<!doctype html><html><body>Report ${a},${b},${n}</body></html>`,file:`${a}-${b}-${n}.html`,prompt:n===1?firstPrompt(a,b):refinementPrompt,fullPrompt:n===1?filledPrompt(a,b):refinementPrompt,critique:n===1?'':'Critique'});
let experiment={runs:ingredientsA.flatMap((name,a)=>ingredientsB.map((other,b)=>({id:`${a}-${b}`,a,b,label:name+' × '+other,steps:Array.from({length:4},(_,i)=>snapshot(a,b,i+1))}))),plain:snapshot(null,null,1),dataset,refinementPrompt,setup:'Test fixture'};
if(existsSync(new URL('../simple-astra/protocol.json',import.meta.url))){const {simpleCatalog}=await import('../simple-astra/catalog.mjs');experiment=simpleCatalog();}
const strongerPrompt=read('../strong-astra/refinement-prompt.txt'),plainStrongerPrompt=read('../strong-astra/plain-refinement-prompt.txt');
const strongerSteps=(steps,prompt)=>steps.map((step,i)=>i?{...step,file:'stronger-'+step.file,html:step.html.replace('</body>','<!-- stronger test fixture --></body>'),prompt,fullPrompt:prompt}:step);
let stronger={experiment:{...experiment,runs:experiment.runs.map(run=>({...run,steps:strongerSteps(run.steps,strongerPrompt)})),refinementPrompt:strongerPrompt},baseline:{...baseline,steps:strongerSteps(baseline.steps,plainStrongerPrompt),protocol:{...baseline.protocol,refinementPrompt:plainStrongerPrompt}}};
const completedStronger=JSON.parse(read('../strong-astra/recorded.json')).length===111;
if(completedStronger){const {strongerCatalogs}=await import('../strong-astra/catalog.mjs');stronger=strongerCatalogs();}
let document;
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.attrs={};this.events={};this.className='';this.textContent='';this.contentWindow={};this.classList={toggle:(name,on)=>{this.className=on?name:''}};}
 append(...children){this.children.push(...children);}
 after(...children){this.afterElements=children;}
 replaceChildren(...children){this.children=children;}
 setAttribute(k,v){this.attrs[k]=v;}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,v){this.events[k]=v;}
 querySelectorAll(selector){const descendants=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);return selector==='*'?descendants:descendants.filter(c=>c.tagName===selector);}
 querySelector(selector){return this.querySelectorAll(selector)[0];}
 focus(){document.activeElement=this;}
 showModal(){this.open=true;}
 close(){this.open=false;this.events.close?.();}
 scrollIntoView(){}
 click(){if(!this.disabled)return this.events.click?.();}
}
const nodes=new Map([...read('play.html').matchAll(/\bid="([^"]+)"/g)].map(m=>['#'+m[1],new Element()]));
nodes.set('#prompt>summary',new Element('summary'));
nodes.set('#plain-prompt-details>summary',new Element('summary'));
const visibleFrames=node=>node.children.filter(child=>!child.hidden).flatMap(child=>[...(child.tagName==='iframe'?[child]:[]),...visibleFrames(child)]);
document={documentElement:{dataset:{}},events:{},addEventListener(k,v){(this.events[k]||=[]).push(v)},activeElement:null,querySelector:s=>nodes.get(s),querySelectorAll:()=>[],createElement:tag=>new Element(tag)};
const observers=[],copies=[],downloads=[],rollout={defer:false,complete:null};
const context=vm.createContext({assert,console,reduced:false,document,window:{addEventListener(){}},history:{replaceState(){}},navigator:{clipboard:{async writeText(text){copies.push(text)}}},URLSearchParams,location:{search:'?stage=4',pathname:'/index.html',href:'https://randomness-for-style.vercel.app/?pair=0-2&stage=2&prompt=stronger'},crypto:webcrypto,EXPERIMENT:experiment,BASELINE:baseline,STRONGER_EXPERIMENT:stronger.experiment,STRONGER_BASELINE:stronger.baseline,INGREDIENTS_A:ingredientsA,INGREDIENTS_B:ingredientsB,IntersectionObserver:function(){this.observe=()=>{}},ResizeObserver:function(callback){this.callback=callback;this.observed=[];this.observe=e=>this.observed.push(e);this.disconnect=()=>{this.observed=[]};observers.push(this)},inviteDice(){},bindPromptPeek(){return {close(){}}},showPrompt(pre,text){pre.textContent=text},matchMedia(query){return {matches:query.includes('prefers-reduced-motion')&&context.reduced,addEventListener(){}}},initDice3D(){},syncDice3D(){},cancelDiceRoll(){rollout.complete=null;},tumbleDice(indices,values,complete,gesture){rollout.indices=indices;rollout.values=values;rollout.gesture=gesture;if(rollout.defer)rollout.complete=complete;else complete();},Blob,URL:{createObjectURL(blob){downloads.push(blob);return 'blob:html'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},nodes,visibleFrames,rollout});
context.settleDieGrab=()=>{};
vm.runInContext(read('refinement-playback.js')+'\n'+read('report-handoff.js')+'\n'+read('play.js'),context);
vm.runInContext(`
assert.equal(introMode,false);assert.equal(method,'stronger');changeMethod('original');assert.equal(selected.id,'0-2');assert.equal(stage,4);assert.equal(view,'dice');assert.equal(nodes.get('#dice-deck').hidden,false);assert.equal(nodes.get('#plain-controls').hidden,true);
assert.equal(nodes.get('#matrix').querySelectorAll('button').length,EXPERIMENT.runs.length);
for(const run of EXPERIMENT.runs){
 selectPair(run);assert.equal(run.steps.length,4);for(let pass=1;pass<=4;pass++){stage=pass;render();assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,run.steps[pass-1].html);assert.equal(nodes.get('#current-prompt').textContent,run.steps[pass-1].prompt);}assert.equal(a,run.a);assert.equal(b,run.b);assert.ok(stage<=run.steps.length);assert.equal(nodes.get('#refinement-range').attrs['aria-valuetext'],stage===1?'One-shot':'Refinement '+(stage-1));
 assert.equal(nodes.get('#refinement-range').value,String(stage));assert.equal(nodes.get('#stage-'+stage).attrs['aria-pressed'],'true');
 const frame=visibleFrames(nodes.get('#report-view'))[0];assert.equal(frame.srcdoc,run.steps[stage-1].html);
 assert.equal([...matrixCells.values()].filter(cell=>!cell.hidden).length,6);assert.equal(nodes.get('#atlas-ingredient').value,String(a));
 assert.equal(nodes.get('#matrix').querySelectorAll('button').filter(button=>button.attrs['aria-pressed']==='true').length,1);
}
stage=1;nodes.get('#atlas-ingredient').events.change({target:{value:'5'}});assert.equal(a,5);
 matrixButtons.get('5-2').click();assert.equal(a,5);assert.equal(b,2);assert.equal(stage,1);
 selectPair(EXPERIMENT.runs[2]);
for(const side of [0,1]){
 bags[side].length=0;const seen=new Set([side?b:a]);
 for(let i=0;i<INGREDIENTS_A.length-1;i++){const before=selected;roll(side);assert.equal(side?a:b,side?before.a:before.b);assert.notEqual(side?b:a,side?before.b:before.a);seen.add(side?b:a);assert.deepEqual(rollout.indices,[side]);}
 assert.equal(seen.size,INGREDIENTS_A.length);
}
// Every grid cell is reachable, and each face appears repeatedly on each die.
for(let pass=1;pass<=4;pass++){
 stage=pass;render();
 for(const side of [0,1])for(let turn=0;turn<6;turn++){
  const prior=selected;roll(side);assert.equal(stage,pass);assert.equal(side?a:b,side?prior.a:prior.b);
  assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[pass-1].html);
  assert.equal(nodes.get('#copy-prompt').textContent,pass===1?'Copy with data':'Copy prompt');
 }
}
stage=1;render();
const reached=new Set();for(let i=0;i<600;i++){const before=selected;roll();assert.notEqual(a,before.a);assert.notEqual(b,before.b);reached.add(selected.id);}assert.equal(reached.size,EXPERIMENT.runs.length);
rollout.defer=true;const before=selected;roll(0);const first=selected;assert.notEqual(selected,before);assert.equal(first.b,before.b);
assert.equal(nodes.get('#pair-title').textContent,first.label);assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,first.steps[stage-1].html);
roll(0);assert.notEqual(selected.a,first.a);assert.equal(selected.b,first.b);
const leftPending=selected;roll(1,{direction:-1,strength:.8});assert.equal(selected.a,leftPending.a);assert.notEqual(selected.b,leftPending.b);assert.equal(rollout.gesture.direction,-1);
const final=selected;rollout.complete();assert.equal(selected,final);
roll(0);const stale=rollout.complete;selectPair(EXPERIMENT.runs[0]);assert.equal(rollout.complete,null);stale();assert.equal(selected,EXPERIMENT.runs[0]);
nodes.get('#compare').click();assert.equal(visibleFrames(nodes.get('#report-view')).length,2);assert.ok(visibleFrames(nodes.get('#report-view')).some(frame=>frame.srcdoc===BASELINE.steps[stage-1].html));
nodes.get('#compare').click();assert.equal(visibleFrames(nodes.get('#report-view')).length,1);
selectPair(EXPERIMENT.runs[2]);assert.equal(stage,1);setAttempt(stage-1);assert.equal(stage,1);
nodes.get('#compare').click();
for(let n=2;n<=4;n++){
 setAttempt(stage+1);assert.equal(stage,n);assert.equal(nodes.get('#refinement-range').attrs['aria-valuetext'],'Refinement '+(n-1));
 assert.ok(visibleFrames(nodes.get('#report-view')).some(frame=>frame.srcdoc===BASELINE.steps[n-1].html));
 assert.ok(visibleFrames(nodes.get('#report-view')).some(frame=>frame.srcdoc===selected.steps[n-1].html));
}
assert.equal(nodes.get('#critique').hidden,false);assert.equal(nodes.get('#refinement-range').value,'4');setAttempt(stage+1);assert.equal(stage,4);
for(let n=3;n>=1;n--){setAttempt(stage-1);assert.equal(stage,n);}
assert.equal(nodes.get('#refinement-range').value,'1');setAttempt(stage-1);assert.equal(stage,1);nodes.get('#compare').click();
selectPair(EXPERIMENT.runs[0]);assert.equal(stage,1);assert.equal(nodes.get('#critique').hidden,true);setAttempt(stage+1);assert.equal(stage,2);assert.equal(nodes.get('#refinement-range').value,'2');setAttempt(stage-1);assert.equal(stage,1);
const cached=visibleFrames(nodes.get('#report-view'))[0];selectPair(EXPERIMENT.runs[1]);selectPair(EXPERIMENT.runs[0]);assert.equal(visibleFrames(nodes.get('#report-view'))[0],cached);
`,context);
await nodes.get('#copy-prompt').click();assert.equal(copies.at(-1),experiment.runs[0].steps[0].fullPrompt);
await nodes.get('#copy-plain').click();assert.equal(copies.at(-1),experiment.plain.fullPrompt);
await nodes.get('#copy-refinement').click();assert.equal(copies.at(-1),experiment.refinementPrompt);
nodes.get('#view-plain').click();assert.equal(nodes.get('#dice-lab').hidden,true);assert.equal(nodes.get('#dice-deck').hidden,true);assert.equal(nodes.get('#dice-controls').hidden,true);assert.equal(nodes.get('#atlas').hidden,true);assert.equal(nodes.get('#plain-lab').hidden,false);assert.equal(nodes.get('#plain-controls').hidden,false);assert.equal(document.activeElement,nodes.get('#plain-title'));
for(let i=0;i<4;i++){
 if(i)nodes.get('#plain-attempt-next').click();assert.equal(visibleFrames(nodes.get('#plain-report'))[0].srcdoc,baseline.steps[i].html);assert.equal(nodes.get('#plain-attempt-label').textContent,i===0?'One-shot':'Refinement '+i);
 await nodes.get('#plain-copy').click();assert.equal(copies.at(-1),baseline.steps[i].fullPrompt);
}
assert.equal(nodes.get('#plain-attempt-next').disabled,true);nodes.get('#plain-attempt-next').click();assert.equal(nodes.get('#plain-attempt-label').textContent,'Refinement 3');
for(let i=0;i<3;i++)nodes.get('#plain-attempt-prev').click();assert.equal(nodes.get('#plain-attempt-prev').disabled,true);nodes.get('#plain-attempt-prev').click();assert.equal(nodes.get('#plain-attempt-label').textContent,'One-shot');
nodes.get('#add-ingredients').click();assert.equal(nodes.get('#dice-lab').hidden,false);assert.equal(nodes.get('#plain-lab').hidden,true);assert.equal(nodes.get('#dice-deck').hidden,false);assert.equal(nodes.get('#dice-controls').hidden,false);assert.equal(nodes.get('#atlas').hidden,false);assert.equal(document.activeElement,nodes.get('#pair-title'));
for(const observer of observers)observer.callback(observer.observed.map(target=>({target,contentRect:{width:140}})));
vm.runInContext(`
for(const track of ['stronger','original']){
 changeMethod(track);assert.equal(method,track);comparing=false;
 for(const run of currentExperiment().runs){
  selectPair(run);
  for(let pass=1;pass<=4;pass++){
   stage=pass;render();assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,run.steps[pass-1].html);assert.equal(nodes.get('#current-prompt').textContent,run.steps[pass-1].prompt);
   for(const [id,cell] of matrixCells){if(!cell.hidden)assert.equal(cell.querySelector('iframe').srcdoc,currentExperiment().runs.find(item=>item.id===id).steps[pass-1].html);}
   assert.equal(nodes.get('#method-note').hidden,pass!==1);
   comparing=true;comparison='other';renderResult();
   const sections=nodes.get('#report-view').children.filter(section=>!section.hidden).sort((left,right)=>Number(left.style.order)-Number(right.style.order));
   assert.equal(sections.length,pass===1?1:2);
   if(pass===1){assert.equal(sections[0].querySelector('h3').textContent,'Shared one-shot');}
   else{assert.equal(sections[0].querySelector('iframe').srcdoc,EXPERIMENT.runs.find(old=>old.id===run.id).steps[pass-1].html);assert.equal(sections[1].querySelector('iframe').srcdoc,STRONGER_EXPERIMENT.runs.find(newer=>newer.id===run.id).steps[pass-1].html);}
   comparison='plain';renderResult();assert.ok(visibleFrames(nodes.get('#report-view')).some(frame=>frame.srcdoc===currentBaseline().steps[pass-1].html));comparing=false;
  }
 }
 for(let pass=1;pass<=4;pass++){plainStage=pass;renderPlain();assert.equal(visibleFrames(nodes.get('#plain-report'))[0].srcdoc,currentBaseline().steps[pass-1].html);}
 stage=3;render();const pair=selected.id;changeMethod(track==='original'?'stronger':'original');assert.equal(stage,3);assert.equal(selected.id,pair);roll(0);assert.equal(stage,3);assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[2].html);
}
changeMethod('stronger');comparing=false;stage=2;render();
reduced=true;stage=2;roll(0);assert.equal(playback.running,false);assert.equal(stage,2);reduced=false;
stage=1;roll(0);assert.equal(playback.running,false);assert.equal(stage,1);
setAttempt(3);assert.equal(playback.running,false);roll(1);assert.equal(stage,3);assert.equal(playback.running,false);
nodes.get('#stage-1').click();assert.equal(stage,1);nodes.get('#refinement-range').events.input({target:{value:'4'}});assert.equal(stage,4);
nodes.get('#play-refinements').click();assert.equal(playback.running,true);assert.equal(stage,1);
assert.equal(nodes.get('#walkthrough-note').hidden,false);assert.equal(nodes.get('#walkthrough-title').textContent,'Add two ingredients');
nodes.get('#play-refinements').click();assert.equal(playback.phase,'paused');assert.equal(nodes.get('#walkthrough-note').hidden,false);assert.equal(nodes.get('#play-word').textContent,'Resume');
nodes.get('#walkthrough-close').click();assert.equal(playback.phase,'idle');assert.equal(nodes.get('#walkthrough-note').hidden,true);assert.equal(document.activeElement,nodes.get('#play-refinements'));
nodes.get('#play-refinements').click();selectPair(currentExperiment().runs[0]);assert.equal(playback.running,false);assert.equal(nodes.get('#walkthrough-note').hidden,true);
const priorMethod=method,priorPair=selected;method='original';
const repeated=EXPERIMENT.runs.find(run=>run.steps.some((step,i)=>i>0&&step.html===run.steps[i-1].html));
if(repeated){selected=repeated;const sameStage=repeated.steps.findIndex((step,i)=>i>0&&step.html===repeated.steps[i-1].html)+1;showWalkthrough(sameStage);assert.equal(nodes.get('#walkthrough-title').textContent,'No change this pass');}
method=priorMethod;selected=priorPair;nodes.get('#walkthrough-note').hidden=true;
stage=3;render();matrixButtons.get('0-4').click();assert.equal(stage,3);assert.equal(selected.id,'0-4');
nodes.get('#atlas-ingredient').events.change({target:{value:'5'}});assert.equal(stage,3);assert.equal(selected.id,'5-4');
stage=2;render();
`,context);
await nodes.get('#copy-prompt').click();assert.equal(copies.at(-1),strongerPrompt);
await nodes.get('#copy-refinement').click();assert.equal(copies.at(-1),strongerPrompt);
nodes.get('#view-plain').click();nodes.get('#plain-method').events.change({target:{value:'stronger'}});
for(let pass=1;pass<=4;pass++){
 vm.runInContext('plainStage='+pass+';renderPlain();',context);
 await nodes.get('#plain-copy').click();assert.equal(copies.at(-1),stronger.baseline.steps[pass-1].fullPrompt);
}
assert.ok(nodes.get('#matrix').querySelector('iframe').style.transform.includes('0.16666'));
assert.ok(!/id="roll"|id="view-dice"|lab-switch|sound-toggle|AudioContext|playDiceClatter/.test(read('play.js')+read('play.html')+read('dice.js')));
assert.ok(!/id="expand"|id="plain-expand"|id="expanded"|attempt-select|Full size/.test(read('play.html')+read('play.js')));
await nodes.get('#copy-link').click();assert.equal(copies.at(-1),context.location.href);assert.equal(nodes.get('#share-status').textContent,'Link copied');
await nodes.get('#copy-refinement').click();assert.equal(copies.at(-1),plainStrongerPrompt);
assert.ok(!/Astra|Codex|Download HTML|Download experiment|Generation setup|generation-wrapper/.test(read('play.html')));
console.log('PASS: both prompt trajectories and baselines, independent dice, all 288 ingredient stage views, exact prompts and share links, shared one-shots, stable comparison order and stage retention. '+(completedStronger?'All saved stronger outputs checked.':'Stronger fixtures used while generation is pending.'));

// The shareable home entry begins with the real, unmodified plain one-shot.
const homeNodes=new Map([...read('play.html').matchAll(/\bid="([^"]+)"/g)].map(m=>['#'+m[1],new Element()]));
const homeDocument={...document,documentElement:{dataset:{}},events:{},querySelector:s=>homeNodes.get(s)};
const guideTasks=new Map();let guideID=0;
const home=vm.createContext({...context,document:homeDocument,nodes:homeNodes,location:{search:'',pathname:'/',href:'https://randomness-for-style.vercel.app/'},history:{replaceState(_a,_b,url){this.url=url}},setTimeout(fn,delay){const id=++guideID;guideTasks.set(id,{fn,delay});return id},clearTimeout(id){guideTasks.delete(id)}});
vm.runInContext(read('refinement-playback.js')+'\n'+read('report-handoff.js')+'\n'+read('play.js'),home);
vm.runInContext(`
assert.equal(introMode,true);assert.equal(stage,1);assert.equal(nodes.get('#refinement-range').disabled,true);
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,STRONGER_BASELINE.steps[0].html);
assert.equal(nodes.get('#current-prompt').textContent,STRONGER_BASELINE.steps[0].prompt);
assert.ok(history.url.includes('start=original'));assert.ok([...matrixButtons.values()].every(button=>button.attrs['aria-pressed']==='false'));
setAttempt(4);assert.equal(stage,1);rollout.defer=false;const initial=selected;roll(0);
assert.equal(introMode,false);assert.equal(stage,1);assert.equal(playback.running,false);assert.deepEqual(rollout.indices,[0,1]);
assert.equal(nodes.get('#refinement-range').disabled,false);
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[0].html);assert.ok(!history.url.includes('start=original'));
`,home);
const cue=[...guideTasks.entries()].find(([,task])=>task.delay===650);assert.ok(cue);guideTasks.delete(cue[0]);cue[1].fn();assert.equal(homeNodes.get('#refinement-rail').dataset.guide,'refine');
vm.runInContext(`setAttempt(2);assert.equal(stage,2);const before=selected;roll(1);assert.equal(stage,2);assert.equal(selected.a,before.a);assert.notEqual(selected.b,before.b);assert.equal(playback.running,false);`,home);
assert.equal(guideTasks.size,0);
vm.runInContext(`introMode=true;stage=1;render();selectPair(currentExperiment().runs[5]);assert.equal(introMode,false);assert.equal(selected.id,'0-5');assert.equal(stage,1);`,home);
vm.runInContext(`
const secureDraw=randomIndex;
for(let left=0;left<6;left++)for(let right=0;right<6;right++){
 introMode=true;stage=1;selected=currentExperiment().runs[2];const draws=[left,right];randomIndex=length=>{assert.equal(length,6);return draws.shift()};roll(0);assert.equal(selected.id,left+'-'+right);assert.equal(stage,1);
}
randomIndex=secureDraw;
`,home);
console.log('PASS: plain-first home, shared later-stage bypass, original prompt identity, first two-die reveal, finite +1 cue without auto-advancing, subsequent independent rolls and gallery bypass.');
vm.runInContext(`
introMode=true;stage=1;selected=currentExperiment().runs[2];render();chooseDieFace(0,5);
assert.equal(introMode,false);assert.equal(selected.id,'5-2');assert.equal(stage,1);
setAttempt(4);chooseDieFace(1,0);assert.equal(selected.id,'5-0');assert.equal(stage,4);
assert.equal(nodes.get('#refinement-rail').style['--progress'],'1');
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[3].html);
`,home);
console.log('PASS: deliberate face choice preserves the other ingredient and refinement, bypasses the intro and updates the report and rail together.');
