const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
let method=params.get('prompt')==='original'?'original':'stronger';
const currentExperiment=()=>method==='original'?EXPERIMENT:STRONGER_EXPERIMENT;
const currentBaseline=()=>method==='original'?BASELINE:STRONGER_BASELINE;
const worlds=INGREDIENTS_A.map(name=>({name}));
const modes={original:{options:INGREDIENTS_B.map((name,i)=>({name,layout:['tech','disco','diner','opera','hotel','insects'][i]}))}};
const active='original';
const legacyPairs={appetite:'0-2',estate:'1-4',station:'2-0',permit:'3-1',performance:'4-3'};
const requestedPair=params.get('pair')||legacyPairs[params.get('test')]||(params.has('a')&&params.has('b')?params.get('a')+'-'+params.get('b'):null);
let selected=currentExperiment().runs.find(run=>run.id===requestedPair)||currentExperiment().runs[2];
let a=selected.a,b=selected.b,stage=Math.min(selected.steps.length,Math.max(1,Math.floor(Number(params.get('stage')))||1));
let comparing=params.get('compare')==='1';
let comparison=params.get('against')==='other'?'other':'plain';
let view=params.get('view')==='plain'?'plain':'dice';
let plainStage=Math.max(1,Math.min(4,Math.floor(Number(params.get('plainStage')))||1));
let introMode=view==='dice'&&(params.get('start')==='original'||(!requestedPair&&!params.has('stage')&&!params.has('compare')));
if(introMode){stage=1;comparing=false;}
const previewCaches=new WeakMap();
const matrixButtons=new Map();
const matrixCells=new Map();
const promptPeeks=[$('#prompt'),$('#plain-prompt-details')].map(bindPromptPeek);
let railVisible=true,guideTimer=null,guideToken=0;
function stopGuidance(){clearTimeout(guideTimer);guideToken++;$('#refinement-rail').removeAttribute('data-guide');}
function guideRefinement(token){
 if(token!==guideToken||stage!==1||introMode||comparing||view!=='dice'||document.hidden||!railVisible||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 guideTimer=setTimeout(()=>{
  if(token!==guideToken)return;
  $('#refinement-rail').dataset.guide='refine';guideTimer=setTimeout(stopGuidance,1600);
 },650);
}
function settlePresentation(){stopGuidance();settleReportHandoff($('#report-view'));settleReportHandoff($('#plain-report'));}
const walkthroughBeats=[
 ['Start with the brief','One prompt, no ingredients. This is the starting point.'],
 ['Add ingredients','Same brief and data. Two ingredients change the visual direction.'],
 ['Refine once','Critique this result. Lean into both ingredients. Keep it simple.'],
 ['Refine again','Repeat the same refinement prompt on the previous result.'],
 ['Third refinement','Same prompt, one more pass. More distinct—or just more?']
];
function showWalkthrough(value){
 const note=$('#walkthrough-note'),wasHidden=note.hidden;
 $('#dice-deck').dataset.beat=String(value);
 $('#dice-hint').textContent=value==='roll'?'Rolling two ingredients…':'Drag to choose · flick to roll';
 if(value==='roll'){note.hidden=true;return;}
 const unchanged=value>1&&selected.steps[value-1].html===selected.steps[value-2].html;
 const [title,text]=unchanged?['No change this pass','The same refinement prompt was repeated. This result stayed unchanged.']:walkthroughBeats[value];
 $('#walkthrough-count').textContent=(value+1)+' / 5';
 $('#walkthrough-title').textContent=title;$('#walkthrough-text').textContent=text;note.hidden=false;
 $('#walkthrough-next').textContent=value===0?'Roll dice →':value===4?'Explore →':'Refine →';
 const copy=wasHidden?note:$('#walkthrough-copy');
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)copy.animate?.([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:170,easing:'cubic-bezier(.23,1,.32,1)'});
}
function rollWalkthrough(complete){
 const values=[nextIngredient(0,selected.a),nextIngredient(1,selected.b)];
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 render(false);
 tumbleDice([0,1],values,complete);
}
const playback=createRefinementPlayback({
 showPlain:()=>{cancelDiceRoll();introMode=true;stage=1;comparing=false;render();},
 rollIngredients:rollWalkthrough,
 setStage:value=>{introMode=false;stage=value;render(false);syncDice3D();},
 canPlay:()=>view==='dice'&&!document.hidden&&railVisible,
 onBeat:showWalkthrough,
 onPlaying:(playing,phase)=>{
  $('#refinement-rail').dataset.playing=String(playing);
  $('#refinement-rail').dataset.touring=String(phase!=='idle');
  $('#dice-deck').dataset.touring=String(phase!=='idle');
  if(phase==='idle'){
   $('#walkthrough-note').hidden=true;$('#dice-deck').removeAttribute('data-beat');
   $('#dice-hint').textContent='Drag to choose · flick to roll';cancelDiceRoll();syncDice3D();
  }
  const button=$('#play-refinements'),label=playing?'Pause walkthrough':phase==='paused'?'Resume walkthrough':phase==='complete'?'Replay walkthrough':'Play walkthrough';
  $('#play-word').textContent=phase==='paused'?'Resume':phase==='complete'?'Replay':'Play';
  button.setAttribute('aria-pressed',String(playing));button.setAttribute('aria-label',label);button.title=label;
 }
});
function updateURL(){
 const query=new URLSearchParams({view,pair:selected.id,stage:String(stage),plainStage:String(plainStage),prompt:method});
 if(comparing)query.set('compare','1');
 if(comparison==='other')query.set('against','other');
 if(introMode)query.set('start','original');
 try{history.replaceState(null,'',location.pathname+'?'+query);}catch{}
}
function addReport(container,item,label){
 const section=document.createElement('section');section.className='frame-section';
 if(label){const title=document.createElement('h3');title.textContent=label;section.append(title);}
 const frame=document.createElement('iframe');frame.title=label||selected.label;frame.className='report-frame';frame.setAttribute('sandbox','allow-scripts');frame.addEventListener('load',()=>frame.dataset.loaded='true');frame.srcdoc=item.html;
 section.append(frame);container.append(section);
 return section;
}
function showReports(container,entries){
 const heldCover=takeReportCover(container);
 let cache=previewCaches.get(container);if(!cache){cache=new Map();previewCaches.set(container,cache);}
 const previous=heldCover?[heldCover]:[...cache.values()].filter(section=>!section.hidden);
 for(const section of cache.values())section.hidden=true;
 entries.forEach(({item,label},order)=>{
  let section=cache.get(item.file);
  if(!section){section=addReport(container,item,label||'Report');cache.set(item.file,section);}
  const heading=section.querySelector('h3');heading.textContent=label||'';heading.hidden=!label;
  section.querySelector('iframe').title=label||(/^(stronger-)?plain-/.test(item.file)?'Plain weekly report':selected.label);
  section.style.order=String(order);section.hidden=false;
  if(entries.length===1&&!label&&previous.length===1)handoffReport(container,previous[0],section);
 });
}
function attemptName(value){return value===1?'One-shot':'Refinement '+(value-1);}
function renderStepper(prefix,value,total){
 $('#'+prefix+'attempt-label').textContent=attemptName(value);
 $('#'+prefix+'attempt-prev').disabled=value===1;
 const next=$('#'+prefix+'attempt-next');next.disabled=value>=total;
 next.title=next.disabled?(total===1?'No refinements saved for this pair':'Last saved refinement'):'Refine more';
}
function renderRail(){
 $('#refinement-rail').style.setProperty('--progress',String((stage-1)/3));
 const range=$('#refinement-range');range.value=String(stage);range.setAttribute('aria-valuetext',attemptName(stage));
 range.disabled=introMode;
 $('#stage-help-1').textContent=introMode?'One prompt with just the brief and data. No ingredients or refinement yet.':'One prompt with the brief, data and two ingredients. No refinement yet.';
 for(let value=1;value<=4;value++){const button=$('#stage-'+value);button.setAttribute('aria-pressed',String(stage===value));button.disabled=introMode;}
 $('#play-refinements').hidden=false;
}
function renderResult(){
 const container=$('#report-view');container.classList.toggle('comparing',comparing);
 const current=introMode?currentBaseline().steps[0]:selected.steps[stage-1];
 const unchanged=stage>1&&current.html===selected.steps[stage-2].html;
 $('#attempt-note').hidden=!unchanged;$('#attempt-note').textContent=unchanged?'Kept '+(stage===2?'the first attempt':'refinement '+(stage-2))+'. See critique.':'';
 const other=(method==='stronger'?EXPERIMENT:STRONGER_EXPERIMENT).runs.find(run=>run.id===selected.id).steps[stage-1];
 const currentLabel=method==='stronger'?'Stronger prompt':'Original prompt',otherLabel=method==='stronger'?'Original prompt':'Stronger prompt';
 let entries=[{item:current,label:''}];
 if(comparing&&comparison==='plain')entries=[{item:currentBaseline().steps[stage-1],label:'Brief only'},{item:current,label:'+ Two ingredients'}];
 if(comparing&&comparison==='other')entries=stage===1?[{item:current,label:'Shared one-shot'}]:method==='stronger'?[{item:other,label:otherLabel},{item:current,label:currentLabel}]:[{item:current,label:currentLabel},{item:other,label:otherLabel}];
 if(introMode)entries=[{item:current,label:''}];
 container.classList.toggle('comparing',entries.length>1);
 showReports(container,entries);
 $('#pair-title').textContent=introMode?'Original one-shot':selected.label;
 if(introMode)$('#compare').removeAttribute('aria-pressed');else $('#compare').setAttribute('aria-pressed',String(comparing));
 $('#compare-label').textContent=introMode?'Roll ingredients':comparing&&comparison==='other'?'Compare prompts':'Compare without ingredients';
 $('#compare-target').hidden=introMode||!comparing;$('#compare-target').value=comparison;$('#compare-other').textContent=otherLabel;
 $('#view-plain').disabled=introMode;$('#view-plain').textContent=introMode?'Original one-shot':'Brief only →';
 $('#copy-link').textContent=introMode?'Share example ↗':'Share this roll ↗';
 $('#method-original').setAttribute('aria-pressed',String(method==='original'));$('#method-stronger').setAttribute('aria-pressed',String(method==='stronger'));
 $('#method-note').hidden=stage!==1;
 renderRail();
 showPrompt($('#current-prompt'),current.prompt,!introMode&&stage===1?`Combine ${INGREDIENTS_A[a]} and ${INGREDIENTS_B[b]} into a distinct visual identity.`:'');
 $('#prompt-title').textContent=stage===1?'One-shot prompt':'Refinement prompt';
 $('#copy-prompt').textContent=stage===1?'Copy with data':'Copy prompt';
 $('#current-critique').textContent=current.critique||'';$('#critique').hidden=!current.critique;
 $('#copy-status').textContent='';$('#share-status').textContent='';
 $('#refinement-prompt').textContent=currentExperiment().refinementPrompt;
}
const thumbnailObserver=new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>{const frame=target.querySelector('iframe');if(frame)frame.style.transform='scale('+(contentRect.width/840)+')';}));
function buildMatrix(){
 const matrix=$('#matrix');matrix.replaceChildren();matrixButtons.clear();matrixCells.clear();thumbnailObserver.disconnect();
 matrix.setAttribute('aria-label',`Choose one of ${EXPERIMENT.runs.length} ingredient combinations`);
 $('#atlas-title').textContent=EXPERIMENT.runs.length+' combinations';
 INGREDIENTS_A.forEach((name,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=name;$('#atlas-ingredient').append(option);});
 for(const run of EXPERIMENT.runs){
  const cell=document.createElement('div'),preview=document.createElement('div'),button=document.createElement('button');
  cell.className='matrix-cell';preview.className='matrix-preview';button.className='matrix-select';button.type='button';button.dataset.pair=run.id;
  button.setAttribute('aria-pressed','false');
  const name=document.createElement('span');name.textContent=INGREDIENTS_B[run.b];button.append(name);
  button.addEventListener('click',()=>{selectPair(run);$('#pair-title').focus({preventScroll:true});$('#dice-lab').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
  const frame=document.createElement('iframe');frame.title=run.label;frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.loading='lazy';preview.append(frame);
  cell.append(preview,button);matrix.append(cell);matrixButtons.set(run.id,button);matrixCells.set(run.id,cell);thumbnailObserver.observe(preview);
 }
}
function render(sync=true){
 a=selected.a;b=selected.b;stage=Math.min(stage,selected.steps.length);
 document.documentElement.dataset.journey=introMode?'original':'ingredients';
 $('#ingredient-a').textContent=introMode?'Ingredient 1':INGREDIENTS_A[a];$('#ingredient-b').textContent=introMode?'Ingredient 2':INGREDIENTS_B[b];
 matrixButtons.forEach((button,id)=>{button.setAttribute('aria-pressed',String(!introMode&&id===selected.id));const run=currentExperiment().runs.find(item=>item.id===id);button.setAttribute('aria-label',run.label+' — '+attemptName(stage));});
 matrixCells.forEach((cell,id)=>{
  cell.hidden=Number(id.split('-')[0])!==a;if(cell.hidden)return;
  const item=currentExperiment().runs.find(run=>run.id===id).steps[stage-1],frame=cell.querySelector('iframe');
  if(frame.dataset.file!==item.file){frame.srcdoc=item.html;frame.dataset.file=item.file;}
 });
 $('#atlas-ingredient').value=String(a);
 renderResult();if(sync)syncDice3D();updateURL();
 $('#status').textContent=introMode?'Original one-shot. Roll either die to add two ingredients.':selected.label+'. '+attemptName(stage)+'.';
}
function selectPair(run){playback.stop();settlePresentation();const introducing=introMode;introMode=false;cancelDiceRoll();selected=currentExperiment().runs.find(item=>item.id===run.id);render();if(introducing)guideRefinement(guideToken);}
function chooseDieFace(index,value){
 playback.stop();settlePresentation();const introducing=introMode;introMode=false;
 if(introducing){stage=1;comparing=false;}
 const values=[selected.a,selected.b];values[index]=value;
 // A deliberate choice keeps the other face, even on the first interaction.
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 render(false);settleDieGrab(index,true);syncDice3D();
 if(introducing)guideRefinement(guideToken);
}
$('#atlas-ingredient').addEventListener('change',event=>selectPair(currentExperiment().runs.find(run=>run.a===Number(event.target.value)&&run.b===b)));
function randomIndex(length){
 const values=new Uint32Array(1),limit=0x100000000-(0x100000000%length);do{crypto.getRandomValues(values)}while(values[0]>=limit);return values[0]%length;
}
// Each die has its own shuffled bag. Exhaust alternatives before repeating.
const bags=[[],[]];
function nextIngredient(index,current){
 let bag=bags[index];if(!bag.length){const count=(index?INGREDIENTS_B:INGREDIENTS_A).length;bag.push(...Array.from({length:count},(_,value)=>value).filter(value=>value!==current));for(let i=bag.length-1;i>0;i--){const j=randomIndex(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}}
 const position=bag.findIndex(value=>value!==current);
 if(position<0){bag.length=0;return nextIngredient(index,current);}
 return bag.splice(position,1)[0];
}
function roll(index,gesture=null){
 playback.stop();settlePresentation();
 const introduce=introMode,token=guideToken;introMode=false;
 if(introduce){stage=1;comparing=false;}
 const before=selected,indices=introduce?[0,1]:index===0||index===1?[index]:[0,1],values=[before.a,before.b];
 indices.forEach(i=>{values[i]=introduce?randomIndex(i?INGREDIENTS_B.length:INGREDIENTS_A.length):nextIngredient(i,values[i]);});
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 // Selection is immediate. The dice acknowledge it without gating the report.
 render(false);
 tumbleDice(indices,values,()=>{syncDice3D();if(introduce)guideRefinement(token);},gesture);
}
async function copyText(text,pre,status){
 try{await navigator.clipboard.writeText(text);status.textContent='Copied.';}catch{pre.hidden=false;pre.textContent=text;const details=pre.closest?.('details');if(details)details.open=true;const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Text selected. Press Ctrl+C or use Copy.';}
}
$('#compare').addEventListener('click',()=>{if(introMode){roll();return;}comparing=!comparing;renderResult();updateURL();});
$('#compare-target').addEventListener('change',event=>{comparison=event.target.value==='other'?'other':'plain';renderResult();updateURL();});
function changeMethod(next){playback.stop();settlePresentation();method=next;promptPeeks.forEach(peek=>peek.close());selected=currentExperiment().runs.find(run=>run.id===selected.id);render();if(view==='plain')renderPlain();}
$('#method-original').addEventListener('click',()=>changeMethod('original'));
$('#method-stronger').addEventListener('click',()=>changeMethod('stronger'));
$('#plain-method').addEventListener('change',event=>changeMethod(event.target.value==='original'?'original':'stronger'));
function setAttempt(value){if(introMode)return;playback.stop();settlePresentation();const next=Math.round(Number(value));if(selected.steps[next-1]){stage=next;render(false);}}
$('#refinement-range').addEventListener('input',event=>setAttempt(event.target.value));
for(let value=1;value<=4;value++){
 const button=$('#stage-'+value);
 button.addEventListener('click',()=>setAttempt(value));
 button.addEventListener('pointerenter',()=>button.removeAttribute('data-help-dismissed'));
 button.addEventListener('focus',()=>button.removeAttribute('data-help-dismissed'));
 button.addEventListener('keydown',event=>{if(event.key==='Escape')button.dataset.helpDismissed='true';});
}
$('#play-refinements').addEventListener('click',()=>{
 stopGuidance();promptPeeks.forEach(peek=>peek.close());
 if(!playback.running)$('#play').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 playback.toggle();
});
$('#walkthrough-close').addEventListener('click',()=>{playback.stop();$('#play-refinements').focus({preventScroll:true});});
$('#walkthrough-next').addEventListener('click',()=>{
 if(playback.beat===4){playback.stop();$('#stage-4').focus({preventScroll:true});}
 else{playback.pause();playback.advance();}
});
$('#walkthrough-prompt').addEventListener('click',()=>{
 playback.pause();promptPeeks[0].open();$('#prompt-trigger').focus({preventScroll:true});
});
// Direct intent takes over immediately. Background/offscreen playback holds its stage.
for(const type of ['pointerdown','focusin','keydown'])document.addEventListener(type,event=>{
 if(event.key==='Escape'){const touring=playback.phase!=='idle';playback.stop();settlePresentation();if(touring)$('#play-refinements').focus({preventScroll:true});}
 else if(event.target.closest('#prompt')){playback.pause();}
 else if(!event.target.closest('#play-refinements,#walkthrough-note')){playback.stop();settlePresentation();}
},true);
$('#prompt').addEventListener('pointerenter',()=>playback.pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden){playback.pause();settlePresentation();}});
window.addEventListener('blur',()=>{playback.pause();settlePresentation();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{playback.pause();settlePresentation();});
const railObserver=new IntersectionObserver(entries=>{railVisible=entries[0].isIntersecting;if(!railVisible){playback.pause();stopGuidance();}});
railObserver.observe($('#refinement-rail'));
const horizontalRail=matchMedia('(max-width:700px)');
function orientRail(){$('#refinement-range').setAttribute('aria-orientation',horizontalRail.matches?'horizontal':'vertical');}
horizontalRail.addEventListener('change',orientRail);orientRail();
$('#copy-prompt').addEventListener('click',()=>copyText((introMode?currentBaseline().steps[0]:selected.steps[stage-1]).fullPrompt,$('#current-prompt'),$('#copy-status')));
$('#refinement-prompt').textContent=EXPERIMENT.refinementPrompt;
const exportPrompt=document.createElement('pre');exportPrompt.hidden=true;$('#export-status').after(exportPrompt);
$('#copy-plain').addEventListener('click',()=>copyText(EXPERIMENT.plain.fullPrompt,exportPrompt,$('#export-status')));
$('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#share-status').textContent='Link copied';}catch{$('#share-status').textContent='Copy the address to share this roll.';}});
$('#copy-refinement').addEventListener('click',()=>copyText(view==='plain'?currentBaseline().protocol.refinementPrompt:currentExperiment().refinementPrompt,$('#refinement-prompt'),$('#export-status')));
function renderPlain(){
 const baseline=currentBaseline(),item=baseline.steps[plainStage-1];showReports($('#plain-report'),[{item,label:''}]);
 $('#plain-method').value=method;
 renderStepper('plain-',plainStage,baseline.steps.length);
 showPrompt($('#plain-prompt'),item.prompt);$('#plain-prompt-title').textContent=plainStage===1?'One-shot prompt':'Refinement prompt';$('#plain-critique-text').textContent=item.critique;$('#plain-critique').hidden=!item.critique;
 $('#plain-copy').textContent=plainStage===1?'Copy with data':'Copy prompt';
 $('#plain-attempt-note').hidden=plainStage===1||item.html!==baseline.steps[plainStage-2].html;
 $('#plain-copy-status').textContent='';updateURL();
}
function selectView(next,focus=false){
 playback.stop();settlePresentation();
 promptPeeks.forEach(peek=>peek.close());
 cancelDiceRoll();view=next==='dice'?'dice':'plain';document.documentElement.dataset.view=view;
 ['#dice-lab','#dice-controls','#dice-deck','#atlas','#refinement-rail'].forEach(id=>$(id).hidden=view!=='dice');
 ['#plain-lab','#plain-controls'].forEach(id=>$(id).hidden=view!=='plain');
 if(view==='plain')renderPlain();else{render();}
 if(focus)$(view==='plain'?'#plain-title':'#pair-title').focus({preventScroll:false});
 updateURL();
}
$('#view-plain').addEventListener('click',()=>selectView('plain',true));
$('#add-ingredients').addEventListener('click',()=>selectView('dice',true));
function changePlainAttempt(delta){const next=plainStage+delta;if(currentBaseline().steps[next-1]){plainStage=next;renderPlain();}}
$('#plain-attempt-prev').addEventListener('click',()=>changePlainAttempt(-1));
$('#plain-attempt-next').addEventListener('click',()=>changePlainAttempt(1));
$('#plain-copy').addEventListener('click',()=>copyText(currentBaseline().steps[plainStage-1].fullPrompt,$('#plain-prompt'),$('#plain-copy-status')));
initDice3D();buildMatrix();render();selectView(view);if(introMode)inviteDice();
