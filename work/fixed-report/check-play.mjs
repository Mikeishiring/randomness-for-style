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
const plainNewerPrompt=refinementPrompt.replace('the same two ingredients','the visual identity');
const newerSnapshot=(a,b,n)=>({...snapshot(a,b,n),file:'newer-'+(a===null?'plain':`${a}-${b}`)+`-${n}.html`,html:`<!doctype html><html><body>Newer ${a},${b},${n}</body></html>`});
let newer={experiment:{...experiment,runs:experiment.runs.map(run=>({...run,steps:Array.from({length:4},(_,i)=>newerSnapshot(run.a,run.b,i+1))})),plain:newerSnapshot(null,null,1),refinementPrompt},baseline:{steps:Array.from({length:4},(_,i)=>({...newerSnapshot(null,null,i+1),...(i?{prompt:plainNewerPrompt,fullPrompt:plainNewerPrompt}:{})})),protocol:{refinementPrompt:plainNewerPrompt}}};
const completedNewer=existsSync(new URL('../simple-fable/protocol.json',import.meta.url));
if(completedNewer){const {fableCatalogs}=await import('../simple-fable/catalog.mjs');newer=fableCatalogs();}
let document;
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.attrs={};this.events={};this.className='';this.textContent='';this.contentWindow={};this.classList={toggle:(name,on)=>{this.className=on?name:''}};}
 append(...children){this.children.push(...children);}
 after(...children){this.afterElements=children;}
 replaceChildren(...children){this.children=children;}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k]??null;}
 removeAttribute(k){delete this.attrs[k];}
 addEventListener(k,v){this.events[k]=v;}
 querySelectorAll(selector){const descendants=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);return selector==='*'?descendants:descendants.filter(c=>c.tagName===selector);}
 querySelector(selector){return this.querySelectorAll(selector)[0];}
 focus(){document.activeElement=this;}
 showModal(){this.open=true;}
 close(){this.open=false;this.events.close?.();}
 scrollIntoView(){}
 // Report frames carry the saved document followed by the scroll bridge; assertions read the saved part.
 set srcdoc(value){this.rawSrcdoc=value;}
 get srcdoc(){return this.rawSrcdoc?.split('<script data-report-scroll>')[0];}
 click(){if(!this.disabled)return this.events.click?.();}
}
const nodes=new Map([...read('play.html').matchAll(/\bid="([^"]+)"/g)].map(m=>['#'+m[1],new Element()]));
nodes.set('#prompt>summary',new Element('summary'));
nodes.set('#plain-prompt-details>summary',new Element('summary'));
const visibleFrames=node=>node.children.filter(child=>!child.hidden).flatMap(child=>[...(child.tagName==='iframe'?[child]:[]),...visibleFrames(child)]);
document={documentElement:{dataset:{}},events:{},addEventListener(k,v){(this.events[k]||=[]).push(v)},activeElement:null,querySelector:s=>nodes.get(s),querySelectorAll:()=>[],createElement:tag=>new Element(tag)};
const observers=[],copies=[],downloads=[],rollout={defer:false,complete:null};
const context=vm.createContext({assert,console,reduced:false,document,window:{listeners:{},addEventListener(k,v){(this.listeners[k]||=[]).push(v)}},history:{replaceState(){}},navigator:{clipboard:{async writeText(text){copies.push(text)}}},URLSearchParams,location:{search:'?stage=4',pathname:'/index.html',href:'https://randomness-for-style.vercel.app/?pair=0-2&stage=2&prompt=stronger'},crypto:webcrypto,EXPERIMENT:experiment,BASELINE:baseline,STRONGER_EXPERIMENT:stronger.experiment,STRONGER_BASELINE:stronger.baseline,NEWER_EXPERIMENT:newer.experiment,NEWER_BASELINE:newer.baseline,INGREDIENTS_A:ingredientsA,INGREDIENTS_B:ingredientsB,IntersectionObserver:function(){this.observe=()=>{}},ResizeObserver:function(callback){this.callback=callback;this.observed=[];this.observe=e=>this.observed.push(e);this.disconnect=()=>{this.observed=[]};observers.push(this)},inviteDice(){},bindPromptPeek(){return {close(){}}},showPrompt(pre,text,addition=''){pre.textContent=text;pre.addition=addition},matchMedia(query){return {matches:query.includes('prefers-reduced-motion')&&context.reduced,addEventListener(){}}},initDice3D(){},syncDice3D(){},cancelDiceRoll(){rollout.complete=null;},tumbleDice(indices,values,complete,gesture){rollout.indices=indices;rollout.values=values;rollout.gesture=gesture;if(rollout.defer)rollout.complete=complete;else complete();},Blob,URL:{createObjectURL(blob){downloads.push(blob);return 'blob:html'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},nodes,visibleFrames,rollout});
context.settleDieGrab=()=>{};
vm.runInContext(read('report-handoff.js')+'\n'+read('play.js'),context);
vm.runInContext(`
assert.equal(introMode,false);assert.equal(method,'stronger');changeMethod('original');assert.equal(selected.id,'0-2');assert.equal(stage,4);assert.equal(view,'dice');assert.equal(nodes.get('#dice-deck').hidden,false);assert.equal(nodes.get('#plain-controls').hidden,true);
assert.equal(nodes.get('#matrix').querySelectorAll('button').length,EXPERIMENT.runs.length);
for(const run of EXPERIMENT.runs){
 selectPair(run);assert.equal(run.steps.length,4);for(let pass=1;pass<=4;pass++){stage=pass;render();assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,run.steps[pass-1].html);assert.equal(nodes.get('#current-prompt').textContent,run.steps[pass-1].prompt);}assert.equal(a,run.a);assert.equal(b,run.b);assert.ok(stage<=run.steps.length);
 assert.equal(nodes.get('#stage-'+stage).attrs['aria-pressed'],'true');
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
 setAttempt(stage+1);assert.equal(stage,n);assert.equal(nodes.get('#stage-'+n).attrs['aria-pressed'],'true');
 assert.ok(visibleFrames(nodes.get('#report-view')).some(frame=>frame.srcdoc===BASELINE.steps[n-1].html));
 assert.ok(visibleFrames(nodes.get('#report-view')).some(frame=>frame.srcdoc===selected.steps[n-1].html));
}
assert.equal(nodes.get('#critique').hidden,false);assert.equal(nodes.get('#stage-4').attrs['aria-pressed'],'true');setAttempt(stage+1);assert.equal(stage,4);
for(let n=3;n>=1;n--){setAttempt(stage-1);assert.equal(stage,n);}
assert.equal(nodes.get('#stage-1').attrs['aria-pressed'],'true');setAttempt(stage-1);assert.equal(stage,1);nodes.get('#compare').click();
selectPair(EXPERIMENT.runs[0]);assert.equal(stage,1);assert.equal(nodes.get('#critique').hidden,true);setAttempt(stage+1);assert.equal(stage,2);assert.equal(nodes.get('#stage-2').attrs['aria-pressed'],'true');setAttempt(stage-1);assert.equal(stage,1);
const cached=visibleFrames(nodes.get('#report-view'))[0];selectPair(EXPERIMENT.runs[1]);selectPair(EXPERIMENT.runs[0]);assert.equal(visibleFrames(nodes.get('#report-view'))[0],cached);
`,context);
await nodes.get('#copy-prompt').click();assert.equal(copies.at(-1),experiment.runs[0].steps[0].fullPrompt);
await nodes.get('#copy-plain').click();assert.equal(copies.at(-1),experiment.plain.fullPrompt);
await nodes.get('#copy-refinement').click();assert.equal(copies.at(-1),experiment.refinementPrompt);
nodes.get('#view-plain').click();assert.equal(nodes.get('#dice-lab').hidden,true);assert.equal(nodes.get('#dice-deck').hidden,true);assert.equal(nodes.get('#stage-bar').hidden,true);assert.equal(nodes.get('#atlas').hidden,true);assert.equal(nodes.get('#plain-lab').hidden,false);assert.equal(nodes.get('#plain-controls').hidden,false);assert.equal(document.activeElement,nodes.get('#plain-title'));
for(let i=0;i<4;i++){
 if(i)nodes.get('#plain-attempt-next').click();assert.equal(visibleFrames(nodes.get('#plain-report'))[0].srcdoc,baseline.steps[i].html);assert.equal(nodes.get('#plain-attempt-label').textContent,i===0?'One-shot':'Refinement '+i);
 await nodes.get('#plain-copy').click();assert.equal(copies.at(-1),baseline.steps[i].fullPrompt);
}
assert.equal(nodes.get('#plain-attempt-next').disabled,true);nodes.get('#plain-attempt-next').click();assert.equal(nodes.get('#plain-attempt-label').textContent,'Refinement 3');
for(let i=0;i<3;i++)nodes.get('#plain-attempt-prev').click();assert.equal(nodes.get('#plain-attempt-prev').disabled,true);nodes.get('#plain-attempt-prev').click();assert.equal(nodes.get('#plain-attempt-label').textContent,'One-shot');
nodes.get('#add-ingredients').click();assert.equal(nodes.get('#dice-lab').hidden,false);assert.equal(nodes.get('#plain-lab').hidden,true);assert.equal(nodes.get('#dice-deck').hidden,false);assert.equal(nodes.get('#stage-bar').hidden,false);assert.equal(nodes.get('#atlas').hidden,false);assert.equal(document.activeElement,nodes.get('#pair-title'));
for(const observer of observers)observer.callback(observer.observed.map(target=>({target,contentRect:{width:140}})));
vm.runInContext(`
for(const track of ['stronger','original','newer']){
 changeMethod(track);assert.equal(method,track);comparing=false;
 assert.equal(nodes.get('#model-toggle').attrs['aria-pressed'],String(track==='newer'));
 for(const run of currentExperiment().runs){
  selectPair(run);
  for(let pass=1;pass<=4;pass++){
   stage=pass;render();assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,run.steps[pass-1].html);assert.equal(nodes.get('#current-prompt').textContent,run.steps[pass-1].prompt);
   for(const [id,cell] of matrixCells){if(!cell.hidden)assert.equal(cell.querySelector('iframe').srcdoc,currentExperiment().runs.find(item=>item.id===id).steps[pass-1].html);}
   assert.equal(nodes.get('#method-note').hidden,pass!==1);
   comparing=true;comparison='other';renderResult();
   const sections=nodes.get('#report-view').children.filter(section=>!section.hidden).sort((left,right)=>Number(left.style.order)-Number(right.style.order));
   if(track==='newer'){
    assert.equal(sections.length,2);
    assert.equal(sections[0].querySelector('h3').textContent,'Earlier model');assert.equal(sections[1].querySelector('h3').textContent,'Newer model');
    assert.equal(sections[0].querySelector('iframe').srcdoc,EXPERIMENT.runs.find(old=>old.id===run.id).steps[pass-1].html);assert.equal(sections[1].querySelector('iframe').srcdoc,NEWER_EXPERIMENT.runs.find(item=>item.id===run.id).steps[pass-1].html);
   }else{
    assert.equal(sections.length,pass===1?1:2);
    if(pass===1){assert.equal(sections[0].querySelector('h3').textContent,'Shared one-shot');}
    else{assert.equal(sections[0].querySelector('iframe').srcdoc,EXPERIMENT.runs.find(old=>old.id===run.id).steps[pass-1].html);assert.equal(sections[1].querySelector('iframe').srcdoc,STRONGER_EXPERIMENT.runs.find(newer=>newer.id===run.id).steps[pass-1].html);}
   }
   comparison='plain';renderResult();assert.ok(visibleFrames(nodes.get('#report-view')).some(frame=>frame.srcdoc===currentBaseline().steps[pass-1].html));comparing=false;
  }
 }
 for(let pass=1;pass<=4;pass++){plainStage=pass;renderPlain();assert.equal(visibleFrames(nodes.get('#plain-report'))[0].srcdoc,currentBaseline().steps[pass-1].html);}
 stage=3;render();const pair=selected.id;changeMethod(track==='original'?'stronger':'original');assert.equal(stage,3);assert.equal(selected.id,pair);roll(0);assert.equal(stage,3);assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[2].html);
}
// The footer toggle flips to the newer model and back to the last prompt track.
changeMethod('original');nodes.get('#model-toggle').click();assert.equal(method,'newer');assert.equal(nodes.get('#model-toggle').attrs['aria-pressed'],'true');
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,NEWER_EXPERIMENT.runs.find(run=>run.id===selected.id).steps[stage-1].html);
nodes.get('#model-toggle').click();assert.equal(method,'original');assert.equal(nodes.get('#model-toggle').attrs['aria-pressed'],'false');
nodes.get('#method-newer').click();assert.equal(method,'newer');assert.equal(nodes.get('#method-newer').attrs['aria-pressed'],'true');
changeMethod('stronger');comparing=false;stage=2;render();
// The main action is reader-paced, and every state can be revisited.
reduced=true;stage=2;roll(0);assert.equal(stage,2);reduced=false;
nodes.get('#stage-0').click();assert.equal(introMode,true);assert.equal(stage,1);
assert.equal(nodes.get('#stage-0').attrs['aria-pressed'],'true');assert.equal(nodes.get('#compare').disabled,true);
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,currentBaseline().steps[0].html);
const rememberedPair=selected;
// Adding randomness from the plain page rolls a fresh pair; the Dice chapter returns to the last one.
nodes.get('#stage-1').click();assert.equal(introMode,false);assert.equal(selected,rememberedPair);assert.equal(stage,1);
assert.equal(nodes.get('#story-title').textContent,'Now add randomness.');assert.equal(nodes.get('#reset').hidden,false);
for(let next=2;next<=4;next++){
 assert.equal(nodes.get('#next-label').textContent,['','','Push it further','Push again','One more push'][next]);
 assert.equal(nodes.get('#next-cue').textContent,'+'+(next-1));
 nodes.get('#experiment-next').click();assert.equal(stage,next);assert.equal(selected,rememberedPair);
 assert.equal(nodes.get('#stage-'+next).attrs['aria-pressed'],'true');
 if(selected.steps[next-1].html!==selected.steps[next-2].html)assert.equal(nodes.get('#story-title').textContent,['','','Now refine it.','Again.','And again.'][next]);
}
assert.equal(nodes.get('#next-label').textContent,'Roll a new pair');assert.equal(nodes.get('#next-cue').textContent,'→');
const finishedPair=selected;nodes.get('#experiment-next').click();assert.equal(stage,1);assert.notEqual(selected,finishedPair);
const resetPair=selected;nodes.get('#reset').click();assert.equal(introMode,true);assert.equal(stage,1);assert.equal(nodes.get('#story-title').textContent,'This is what one prompt gets you.');assert.equal(document.activeElement,nodes.get('#experiment-next'));
assert.equal(nodes.get('#next-label').textContent,'Add randomness');
// The first roll throws both dice: every saved page needs both ingredients, so the page changes at once.
nodes.get('#experiment-next').click();assert.equal(introMode,false);assert.equal(stage,1);assert.deepEqual([...rollout.indices],[0,1]);assert.equal(nodes.get('#next-label').textContent,'Push it further');assert.equal(document.documentElement.dataset.journey,'ingredients');
const firstPair=selected;roll(1);assert.equal(selected.a,firstPair.a);assert.notEqual(selected.b,firstPair.b,'rolling the second die changes the page again');assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[0].html);
nodes.get('#stage-3').click();assert.equal(stage,3);
const closedPair=selected;nodes.get('#stage-0').click();nodes.get('#stage-1').click();assert.equal(selected,closedPair);assert.equal(stage,1);
const priorMethod=method,priorPair=selected;method='original';
const repeated=EXPERIMENT.runs.find(run=>run.steps.some((step,i)=>i>0&&step.html===run.steps[i-1].html));
if(repeated){selected=repeated;stage=repeated.steps.findIndex((step,i)=>i>0&&step.html===repeated.steps[i-1].html)+1;showStory();assert.equal(nodes.get('#story-title').textContent,'No change this pass.');}
method=priorMethod;selected=priorPair;
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
assert.ok(!/id="roll"|id="view-dice"|lab-switch/.test(read('play.js')+read('play.html')+read('dice.js')));
assert.ok(!/id="expand"|id="plain-expand"|id="expanded"|attempt-select|Full size/.test(read('play.html')+read('play.js')));
await nodes.get('#copy-link').click();assert.equal(copies.at(-1),context.location.href);assert.equal(nodes.get('#share-status').textContent,'Copied');
await nodes.get('#copy-refinement').click();assert.equal(copies.at(-1),plainStrongerPrompt);
nodes.get('#plain-method').events.change({target:{value:'newer'}});
for(let pass=1;pass<=4;pass++){
 vm.runInContext('plainStage='+pass+';renderPlain();',context);
 assert.equal(visibleFrames(nodes.get('#plain-report'))[0].srcdoc,newer.baseline.steps[pass-1].html);
 await nodes.get('#plain-copy').click();assert.equal(copies.at(-1),newer.baseline.steps[pass-1].fullPrompt);
}
await nodes.get('#copy-refinement').click();assert.equal(copies.at(-1),newer.baseline.protocol.refinementPrompt);
nodes.get('#plain-method').events.change({target:{value:'stronger'}});
assert.ok(!/Astra|Codex|Download HTML|Download experiment|Generation setup|generation-wrapper/.test(read('play.html')));
console.log('PASS: all three recorded tracks and baselines, independent dice, all 432 ingredient stage views, exact prompts and share links, shared prompt-track one-shots, the newer model beside the earlier one, stable comparison order and stage retention. '+(completedStronger?'All saved stronger outputs checked.':'Stronger fixtures used while generation is pending.')+' '+(completedNewer?'All saved newer-model outputs checked.':'Newer-model fixtures used while generation is pending.'));

// The shareable home entry begins with the real, unmodified plain one-shot.
const homeNodes=new Map([...read('play.html').matchAll(/\bid="([^"]+)"/g)].map(m=>['#'+m[1],new Element()]));
const homeDocument={...document,documentElement:{dataset:{}},events:{},querySelector:s=>homeNodes.get(s)};
const guideTasks=new Map();let guideID=0;
const home=vm.createContext({...context,document:homeDocument,nodes:homeNodes,location:{search:'',pathname:'/',href:'https://randomness-for-style.vercel.app/'},history:{replaceState(_a,_b,url){this.url=url}},setTimeout(fn,delay){const id=++guideID;guideTasks.set(id,{fn,delay});return id},clearTimeout(id){guideTasks.delete(id)}});
vm.runInContext(read('report-handoff.js')+'\n'+read('play.js'),home);
vm.runInContext(`
assert.equal(introMode,true);assert.equal(stage,1);assert.equal(nodes.get('#stage-2').disabled,true);assert.equal(nodes.get('#story-title').textContent,'This is what one prompt gets you.');assert.equal(nodes.get('#reset').hidden,true);
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,STRONGER_BASELINE.steps[0].html);
assert.equal(nodes.get('#current-prompt').textContent,STRONGER_BASELINE.steps[0].prompt);
assert.ok(history.url.includes('start=original'));assert.ok([...matrixButtons.values()].every(button=>button.attrs['aria-pressed']==='false'));
setAttempt(4);assert.equal(stage,1);rollout.defer=false;const initial=selected;roll();
assert.equal(introMode,false);assert.equal(stage,1);assert.deepEqual(rollout.indices,[0,1]);
assert.equal(nodes.get('#stage-2').disabled,false);
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[0].html);assert.ok(!history.url.includes('start=original'));
`,home);
assert.equal(guideTasks.size,0,'The guided path must not schedule automatic progression');
vm.runInContext(`setAttempt(2);assert.equal(stage,2);const before=selected;roll(1);assert.equal(stage,2);assert.equal(selected.a,before.a);assert.notEqual(selected.b,before.b);`,home);
vm.runInContext(`introMode=true;stage=1;render();selectPair(currentExperiment().runs[5]);assert.equal(introMode,false);assert.equal(selected.id,'0-5');assert.equal(stage,1);`,home);
vm.runInContext(`
const secureDraw=randomIndex;
for(let left=0;left<6;left++)for(let right=0;right<6;right++){
 introMode=true;stage=1;selected=currentExperiment().runs[2];const draws=[left,right];randomIndex=length=>{assert.equal(length,6);return draws.shift()};roll();assert.equal(selected.id,left+'-'+right);assert.equal(stage,1);
}
randomIndex=secureDraw;
`,home);
console.log('PASS: plain-first home, shared later-stage bypass, original prompt identity, a first roll that throws both dice and changes the page, a second-die roll that changes it again, a five-step story headline without timers, reset to the plain page, subsequent independent rolls and gallery bypass.');
vm.runInContext(`
introMode=true;stage=1;selected=currentExperiment().runs[2];render();chooseDieFace(0,5);
assert.equal(introMode,false);assert.equal(selected.id,'5-2');assert.equal(stage,1);
setAttempt(4);chooseDieFace(1,0);assert.equal(selected.id,'5-0');assert.equal(stage,4);
assert.equal(nodes.get('#refinement-rail').style['--step'],'4');
assert.equal(visibleFrames(nodes.get('#report-view'))[0].srcdoc,selected.steps[3].html);
`,home);
console.log('PASS: deliberate face choice preserves the other ingredient and refinement, bypasses the intro and updates the report and rail together.');
vm.runInContext(`{
comparing=false;introMode=false;view='dice';selected=currentExperiment().runs[0];stage=1;render();
const message=(frame,data)=>window.listeners.message.forEach(fn=>fn({source:frame.contentWindow,data}));
const listen=frame=>{const posts=[];frame.contentWindow={postMessage:m=>posts.push(m)};return posts;};
const first=visibleFrames(nodes.get('#report-view'))[0];
assert.ok(first.rawSrcdoc.startsWith(selected.steps[0].html));assert.ok(first.rawSrcdoc.includes('<script data-report-scroll>'));
listen(first);message(first,{type:'report-scroll',ratio:.6});
setAttempt(2);const second=visibleFrames(nodes.get('#report-view'))[0];assert.notEqual(second,first);
const received=listen(second);message(second,{type:'report-ready'});
assert.equal(received.length,1);assert.equal(received[0].type,'report-scroll-to');assert.equal(received[0].ratio,.6);
comparing=true;comparison='plain';renderResult();const pair=visibleFrames(nodes.get('#report-view'));assert.equal(pair.length,2);
const left=listen(pair[0]),right=listen(pair[1]);message(pair[0],{type:'report-scroll',ratio:.25});
assert.equal(left.length,0);assert.equal(right.length,1);assert.equal(right[0].ratio,.25);
message(pair[1],{type:'report-scroll',ratio:7});assert.equal(left[0].ratio,1);
comparing=false;renderResult();
}`,context);
console.log('PASS: reports keep the reading position across steps and scroll together in comparison.');
vm.runInContext(`{
pointer.custom=null;comparing=false;view='dice';introMode=true;stage=1;render();
assert.equal(pointerSpec().title,'This is what one prompt gets you.');assert.equal(pointerSpec().action.label,'Roll the dice');assert.equal(typeof pointerSpec().demo.run,'function','the first card also offers the demo');
roll(0,null,[3,0]);assert.equal(introMode,false);assert.equal(pointerSpec(),null,'after a roll nothing floats beside the Refine button');
assert.deepEqual({...promptLineState()},{a:'Bureaucracy',b:'Tech',changed:null,pushes:0,same:false,ask:''});
assert.ok(selected.steps[0].prompt.includes(ingredientLine('Bureaucracy','Tech')),'the line above the page is the exact sentence added to the prompt');
roll(0,null,[2]);assert.equal(promptLineState().a,'Weather');assert.equal(promptLineState().changed,0,'the die that changed is marked');
roll(1,null,[undefined,1]);assert.equal(promptLineState().b,'Disco');assert.equal(promptLineState().changed,1);
{const row=nodes.get('#prompt-row'),line=nodes.get('#prompt-line'),panel=nodes.get('#prompt-full');renderPromptLine();assert.equal(row.dataset.empty,'false');
 assert.equal(line.children.filter(child=>child.tagName==='b').map(child=>child.textContent).join(' + '),'Weather + Disco');
 line.click();assert.equal(panel.hidden,false,'tapping the line opens the whole prompt');assert.equal(line.attrs['aria-expanded'],'true');
 assert.equal(panel.children[0].textContent,selected.steps[0].prompt);assert.equal(panel.children[0].addition,'Combine Weather and Disco into a distinct visual identity.','with the added line marked');
 line.click();assert.equal(panel.hidden,true);}
setAttempt(2);assert.equal(pointerSpec(),null,'a push is said in the line above the page, not in a floating note');
{const state=promptLineState(),line=nodes.get('#prompt-line'),panel=nodes.get('#prompt-full');assert.equal(state.pushes,1);assert.equal(state.ask,selected.steps[1].prompt.split(/(?<=[.!?])\\s+/)[0],'in the opening sentence of the refinement prompt, exactly as sent');renderPromptLine();const push=line.children.at(-1);assert.equal(push.className,'prompt-push');assert.equal(push.children[0].textContent,'Then asked, once: ');assert.ok(push.children[1].textContent.endsWith('\\u2026'));line.click();assert.equal(panel.children.length,2,'and the whole prompt shows the push under the one-shot');line.click();}
setAttempt(4);assert.equal(pointerSpec(),null,'the last step asks its question on the page');
{const panel=nodes.get('#keep'),list=nodes.get('#keep-versions');assert.equal(panel.hidden,false,'which would you keep?');
 assert.equal(list.children.map(button=>button.children[1].textContent).join(','),'No dice,Dice,+1,+2,+3','every version is laid out');
 assert.equal(list.children[4].children[0].children[0].srcdoc,selected.steps[3].html);
 assert.equal(nodes.get('#keep-title').textContent,'Which would you keep?');globalThis.CURATION={picks:{[method]:{[selected.id]:{pick:3,reason:'test reason'}}}};
 list.children[2].click();assert.equal(stage,2,'choosing a version shows it');assert.equal(list.children[2].attrs['aria-pressed'],'true','and marks it kept');assert.equal(panel.hidden,false,'the choice stays in view');
 assert.equal(nodes.get('#keep-title').textContent,'You kept +1. Our pick is +2: test reason.','the question is answered with the pick saved for this pair');assert.equal(list.children[3].dataset.ours,'true');
 assert.equal(nodes.get('#next-label').textContent,'Roll a new pair','keeping one ends the pass: the action offers the next pair');
 list.children[3].click();assert.equal(nodes.get('#keep-title').textContent,'You kept +2. So did we: test reason.');assert.equal(list.children[3].dataset.ours,'false');delete globalThis.CURATION;
 roll(0,null,[5]);assert.equal(panel.hidden,true,'a new pair starts a new journey');}
showBrief();assert.equal(pointerSpec().title,'Fresh start.');
{const keep=SHOWCASE;SHOWCASE=['3-1'];guidedIn=false;const drawn=introPair();assert.equal(drawn.join('-'),'3-1','the first roll of a visit lands on a curated showcase pair');
 roll(0);assert.equal(selected.a+'-'+selected.b,'3-1');assert.equal(guidedIn,true,'after that, rolls are random');
 SHOWCASE=keep;showBrief();}assert.equal(promptLineState(),null,'a fresh start has no added line');
}`,context);
console.log('PASS: after a roll nothing floats beside the action: one line above the page is the exact sentence the dice added to the prompt, the changed die marked, and it opens the whole prompt with that line marked; each push is said in that line in the opening words of the refinement prompt, a kept version is answered with the saved pick and ends the pass, the first roll of a visit lands on a curated showcase pair and later ones are random, and the last card carries Compare.');
vm.runInContext(`{
 const box=nodes.get('#before-after'),handle=nodes.get('#ba-handle'),key=k=>handle.events.keydown({key:k,preventDefault(){}});
 const before=()=>nodes.get('#report-view').children.filter(c=>c.tagName==='section'&&!c.hidden&&c.className==='report-before');
 const original=()=>currentBaseline().steps[0];
 pointer.custom=null;view='dice';comparing=false;introMode=false;method='stronger';selected=currentExperiment().runs[2];stage=1;render();key('Home');
 assert.equal(box.hidden,false,'the slider is there from the first roll');assert.equal(beforeAfter.item,original(),'it compares with the original report');
 assert.equal(before().length,0,'at rest only the current page shows');
 key('End');assert.equal(handle.attrs['aria-valuenow'],'100');assert.equal(before().length,1);
 assert.equal(before()[0].querySelector('iframe').srcdoc,original().html);assert.equal(before()[0].style.clipPath,'inset(0 0.000% 0 0)');
 key('ArrowLeft');assert.equal(handle.attrs['aria-valuenow'],'95');assert.equal(before()[0].style.clipPath,'inset(0 5.000% 0 0)');
 key('Home');assert.equal(before().length,0);assert.equal(handle.attrs['aria-valuetext'],'Current page');
 // The position holds through refinements and rolls; only the after side changes, and the original stays.
 key('Enter');assert.equal(handle.attrs['aria-valuenow'],'50');
 setAttempt(2);assert.equal(handle.attrs['aria-valuenow'],'50','a refinement keeps the slider where it was');
 assert.equal(before().length,1);assert.equal(before()[0].querySelector('iframe').srcdoc,original().html,'the before side is still the original');
 assert.equal(visibleFrames(nodes.get('#report-view')).filter(frame=>frame.srcdoc===selected.steps[1].html).length,1,'the new pass shows on the after side');
 const pair=selected;roll(0);assert.notEqual(selected.a,pair.a);assert.equal(handle.attrs['aria-valuenow'],'50','a roll keeps the slider where it was');
 assert.equal(before()[0].querySelector('iframe').srcdoc,original().html);
 render();assert.equal(handle.attrs['aria-valuenow'],'50');assert.equal(before().length,1);
 comparing=true;renderResult();assert.equal(box.hidden,true,'side-by-side comparison replaces the slider');assert.equal(before().length,0);comparing=false;renderResult();assert.equal(before().length,1);
 // The first page that lands is put beside the original at once (after a beat to see it alone): wide screens
 // open the side-by-side comparison, labelled with the same data; a change before then cancels it, and it
 // happens only once.
 {key('Home');beforeAfter.hinted=false;let clock=0;const frames=[];
  globalThis.performance={now:()=>clock};globalThis.requestAnimationFrame=fn=>frames.push(fn);globalThis.cancelAnimationFrame=id=>{frames[id-1]=null;};
  const tick=at=>{clock=at;const queued=frames.splice(0);queued.forEach(fn=>fn?.(at));};
  const view=nodes.get('#report-view');
  reportHandoffSettled(view);assert.equal(beforeAfter.hinting,true);
  tick(BEFORE_AFTER_HINT_WAIT-50);assert.equal(comparing,false,'the new page is seen on its own first');
  setAttempt(3);assert.equal(beforeAfter.hinting,false);assert.equal(frames.filter(Boolean).length,0,'a change cancels it');assert.equal(beforeAfter.hinted,false,'unseen, it waits for the next page');
  clock=10000;reportHandoffSettled(view);tick(10000+BEFORE_AFTER_HINT_WAIT+50);assert.equal(comparing,true,'then before and after sit side by side');
  const labels=view.children.filter(child=>child.tagName==='section'&&!child.hidden).map(section=>section.children.find(child=>child.tagName==='h3'));
  assert.ok(labels.length===2&&labels.every(label=>label.children.some(child=>child.className==='same-data'&&child.textContent==='Same data')),'both reports say the data is the same');
  assert.ok(labels.some(label=>label.textContent==='No dice, pushed twice'),'the baseline says it had the same pushes');
  assert.equal(beforeAfter.hinted,true);reportHandoffSettled(view);assert.equal(beforeAfter.hinting,false,'it happens once');
  roll(0,null,[1]);assert.equal(comparing,false,'throwing a die goes back to the single page it can strike');
  delete globalThis.requestAnimationFrame;delete globalThis.cancelAnimationFrame;delete globalThis.performance;}
 // Just after a roll the action waits quietly; once nothing is moving it steps forward, and refining brings it back at once.
 {let clock=0;const frames=[];globalThis.performance={now:()=>clock};globalThis.requestAnimationFrame=fn=>frames.push(fn);globalThis.cancelAnimationFrame=id=>{frames[id-1]=null;};
  const tick=at=>{clock=at;const queued=frames.splice(0);queued.forEach(fn=>fn?.(at));},button=nodes.get('#experiment-next');
  roll(0);assert.equal(button.dataset.quiet,'true','just after a roll the action waits quietly');
  tick(100);tick(100+REFINE_CALM-50);assert.equal(button.dataset.quiet,'true');
  tick(100+REFINE_CALM+50);assert.equal(button.dataset.quiet,undefined,'once everything is still it steps forward');
  roll(1);assert.equal(button.dataset.quiet,'true');setAttempt(2);assert.equal(button.dataset.quiet,undefined,'refining brings it back at once');
  delete globalThis.requestAnimationFrame;delete globalThis.cancelAnimationFrame;delete globalThis.performance;}
 changeFrom(nodes.get('#reset'),showBrief);assert.equal(box.hidden,true,'nothing to compare before the dice');assert.equal(handle.attrs['aria-valuenow'],'0','a fresh start puts the slider away');
 // Only a visitor's first roll is celebrated; the demo's authored rolls never are.
 firstRollCelebrated=false;const demoRoll={},first={},second={};
 celebrateFirstRoll(demoRoll,[0]);celebrateFirstRoll(first,null);celebrateFirstRoll(second,null);
 assert.equal(demoRoll.celebrate,undefined);assert.equal(first.celebrate,true);assert.equal(second.celebrate,undefined);
}`,context);
// The gallery stays folded until asked for, and folds away again.
{const toggle=nodes.get('#atlas-toggle'),body=nodes.get('#atlas-body');
 body.hidden=true;toggle.attrs['aria-expanded']='false';
 toggle.click();assert.equal(toggle.attrs['aria-expanded'],'true');assert.equal(body.hidden,false);
 toggle.click();assert.equal(toggle.attrs['aria-expanded'],'false');assert.equal(body.hidden,true);}
console.log('PASS: the before/after slider is there from the first roll, always compares with the original, follows keys and taps, keeps its place through refinements, rolls and re-renders, puts the first landed page beside the original once, labelled same data, and never while a change is under way, steps aside for side-by-side comparison and goes away on a fresh start; the action waits quietly after a roll until everything is still; the gallery folds open and closed; only the first real roll is celebrated.');
