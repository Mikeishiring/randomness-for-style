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
let ingredientsChosen=!introMode,paintedStep=null;
const actionAnimations=new Map();
function updateActionText(node,text,animate){
 if(node.textContent===text)return;
 actionAnimations.get(node)?.cancel();actionAnimations.delete(node);
 node.textContent=text;
 if(!animate||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||!node.animate)return;
 const animation=node.animate([{opacity:.2,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:160,easing:'cubic-bezier(.25,.8,.25,1)'});
 actionAnimations.set(node,animation);
 animation.onfinish=()=>{if(actionAnimations.get(node)===animation)actionAnimations.delete(node);};
}
function syncRailMarker(animate=false){
 const button=$('#stage-'+(introMode?0:stage)),marker=$('#rail-marker');
 const target=button.getBoundingClientRect?.(),track=$('#rail-stops').getBoundingClientRect?.();
 if(!target?.width||!track)return;
 marker.style.transitionDuration=animate&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'220ms':'0ms';
 const first=$('#stage-0').getBoundingClientRect?.()||target;
 marker.style.width=(target.right-first.left)+'px';marker.style.transform='translateX('+(first.left-track.left)+'px)';
}
const railResize=new ResizeObserver(()=>syncRailMarker());railResize.observe($('#rail-stops'));
function settlePresentation(){settleReportHandoff($('#report-view'));settleReportHandoff($('#plain-report'));}
// The page tells its story in one headline per step; every step stays reachable from the chapters.
const storyBeats=[
 ['One prompt. One page.','“Create a one-page website that helps its owner understand this week’s website performance.”'],
 ['Now add randomness.','Same prompt, plus two ingredients. Click a die to swap one.'],
 ['Now refine it.','Critique harshly, then commit harder to both ingredients.'],
 ['Again.','The same prompt, run on the last result.'],
 ['And again.','More distinct, or just more?']
];
function storyFor(value){
 if(value>1&&selected.steps[value-1].html===selected.steps[value-2].html)return ['No change this pass.','The same prompt ran again; the model kept the last result.'];
 return storyBeats[value];
}
function showStory(){
 const value=introMode?0:stage,[title,text]=storyFor(value);
 const changed=$('#story-title').textContent!==title;
 $('#story-title').textContent=title;$('#story-text').textContent=text;
 $('#refinement-rail').style.setProperty('--step',String(value));
 if(changed&&paintedStep!==null&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#story').animate?.([{opacity:.15},{opacity:1}],{duration:200,easing:'ease-out'});
}
// The dice enter from either side when ingredients are added, and leave the same way on reset.
let diceStageAnimations=[];
function moveDice(entering){
 diceStageAnimations.forEach(animation=>animation.cancel());diceStageAnimations=[];
 const deck=$('#dice-deck');deck.classList?.toggle('leaving',false);
 if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(!entering)deck.classList?.toggle('leaving',true);
 document.querySelectorAll('.die').forEach((die,i)=>{
  const object=die.querySelector('.die-object'),label=die.querySelector('strong'),rect=object?.getBoundingClientRect?.();
  if(!rect?.width||!object.animate)return;
  const away=i?Math.max(180,innerWidth-rect.left+24):-Math.max(180,rect.right+24);
  if(entering){
   diceStageAnimations.push(object.animate([{transform:`translateX(${away}px)`},{transform:'translateX(0)'}],{duration:720,delay:i*110,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
   diceStageAnimations.push(label.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:240,delay:520+i*110,easing:'ease-out',fill:'backwards'}));
  }else{
   const exit=object.animate([{transform:'translateX(0)'},{transform:`translateX(${away}px)`}],{duration:380,delay:i*50,easing:'cubic-bezier(.55,0,.8,.2)',fill:'forwards'});
   diceStageAnimations.push(exit,label.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease-in',fill:'forwards'}));
   if(i)exit.onfinish=()=>{if(diceStageAnimations.includes(exit)){deck.classList.toggle('leaving',false);diceStageAnimations.forEach(animation=>animation.cancel());diceStageAnimations=[];}};
  }
 });
}
function showBrief(){if(introMode)return;settlePresentation();cancelDiceRoll();introMode=true;stage=1;comparing=false;render();}
function showIngredients(){
 if(!ingredientsChosen){roll();return;}
 settlePresentation();introMode=false;stage=1;render();
}
function nextExperimentStep(){
 promptPeeks.forEach(peek=>peek.close());
 if(introMode){roll();}
 else if(stage<4){setAttempt(stage+1);}
 else{stage=1;comparing=false;roll();}
}
function updateURL(){
 const query=new URLSearchParams({view,pair:selected.id,stage:String(stage),plainStage:String(plainStage),prompt:method});
 if(comparing)query.set('compare','1');
 if(comparison==='other')query.set('against','other');
 if(introMode)query.set('start','original');
 try{history.replaceState(null,'',location.pathname+'?'+query);}catch{}
}
// Saved reports scroll inside sandboxed frames. A small bridge, appended after the saved
// document, shares the reading position so a new step or a comparison opens at the same place.
// A requested position is re-applied while the report's own layout settles, until the reader scrolls.
const REPORT_SCROLL_BRIDGE='<script data-report-scroll>(()=>{let quietUntil=0,queued=false,target=null;const room=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);const apply=()=>{if(target===null)return;quietUntil=performance.now()+150;scrollTo({top:Math.round(target*room()),behavior:"instant"});};addEventListener("message",e=>{if(e.source!==parent||e.data?.type!=="report-scroll-to")return;target=e.data.ratio;apply();});addEventListener("scroll",()=>{if(performance.now()<quietUntil)return;target=null;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const r=room();parent.postMessage({type:"report-scroll",ratio:r?scrollY/r:0},"*");});},{passive:true});const settle=new ResizeObserver(apply);settle.observe(document.documentElement);if(document.body)settle.observe(document.body);addEventListener("load",()=>parent.postMessage({type:"report-ready"},"*"),{once:true});})();<\/script>';
const reportScroll=new Map();
function visibleReportFrames(container){const cache=previewCaches.get(container);return cache?[...cache.values()].filter(section=>!section.hidden).map(section=>section.querySelector('iframe')):[];}
function scrollReport(frame,ratio){frame.contentWindow?.postMessage?.({type:'report-scroll-to',ratio},'*');}
window.addEventListener('message',event=>{
 const type=event.data?.type;if(type!=='report-ready'&&type!=='report-scroll')return;
 for(const container of [$('#report-view'),$('#plain-report')]){
  const frames=visibleReportFrames(container),source=frames.find(frame=>frame.contentWindow===event.source);
  if(!source)continue;
  if(type==='report-ready'){scrollReport(source,reportScroll.get(container)||0);return;}
  const ratio=Math.min(1,Math.max(0,Number(event.data.ratio)||0));reportScroll.set(container,ratio);
  frames.forEach(frame=>{if(frame!==source)scrollReport(frame,ratio);});
  return;
 }
});
function addReport(container,item,label){
 const section=document.createElement('section');section.className='frame-section';
 if(label){const title=document.createElement('h3');title.textContent=label;section.append(title);}
 const frame=document.createElement('iframe');frame.title=label||selected.label;frame.className='report-frame';frame.setAttribute('sandbox','allow-scripts');frame.addEventListener('load',()=>frame.dataset.loaded='true');frame.srcdoc=item.html+REPORT_SCROLL_BRIDGE;
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
  const frame=section.querySelector('iframe');if(frame.dataset.loaded==='true')scrollReport(frame,reportScroll.get(container)||0);
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
 const value=introMode?0:stage;
 const animate=paintedStep!==null&&paintedStep!==value;
 for(let n=0;n<=4;n++){
  const button=$('#stage-'+n);button.setAttribute('aria-pressed',String(n===value));
  button.disabled=introMode&&n>1;
 }
 const refining=!introMode&&stage<4;
 const label=introMode?'Add randomness':stage===1?'Refine it':stage<4?'Again, same prompt':'Roll a new pair';
 const cue=refining?'+'+stage:'→';
 $('#experiment-next').dataset.action=refining?'refine':'roll';
 $('#experiment-next').setAttribute('aria-label',refining?label+'. Refinement '+stage:label);
 updateActionText($('#next-label'),label,animate);updateActionText($('#next-cue'),cue,animate);
 showStory();syncRailMarker(animate);paintedStep=value;
}
function renderResult(){
 const container=$('#report-view');container.classList.toggle('comparing',comparing);
 const current=introMode?currentBaseline().steps[0]:selected.steps[stage-1];
 const other=(method==='stronger'?EXPERIMENT:STRONGER_EXPERIMENT).runs.find(run=>run.id===selected.id).steps[stage-1];
 const currentLabel=method==='stronger'?'Stronger prompt':'Original prompt',otherLabel=method==='stronger'?'Original prompt':'Stronger prompt';
 let entries=[{item:current,label:''}];
 if(comparing&&comparison==='plain')entries=[{item:currentBaseline().steps[stage-1],label:'Brief only'},{item:current,label:'+ Two ingredients'}];
 if(comparing&&comparison==='other')entries=stage===1?[{item:current,label:'Shared one-shot'}]:method==='stronger'?[{item:other,label:otherLabel},{item:current,label:currentLabel}]:[{item:current,label:currentLabel},{item:other,label:otherLabel}];
 if(introMode)entries=[{item:current,label:''}];
 container.classList.toggle('comparing',entries.length>1);
 showReports(container,entries);
 $('#pair-title').textContent=introMode?'Brief only':selected.label;
 $('#compare').disabled=introMode;
 $('#compare').setAttribute('aria-pressed',String(comparing));
 $('#compare').setAttribute('aria-label',comparing&&comparison==='other'?'Compare refinement prompts':'Compare with brief only');
 $('#compare-target').hidden=introMode||!comparing;$('#compare-target').value=comparison;$('#compare-other').textContent=otherLabel;
 $('#view-plain').disabled=false;$('#view-plain').textContent='Refine brief alone →';
 $('#method-original').setAttribute('aria-pressed',String(method==='original'));$('#method-stronger').setAttribute('aria-pressed',String(method==='stronger'));
 $('#method-note').hidden=stage!==1;
 renderRail();
 showPrompt($('#current-prompt'),current.prompt,!introMode&&stage===1?`Combine ${INGREDIENTS_A[a]} and ${INGREDIENTS_B[b]} into a distinct visual identity.`:'');
 $('#prompt-title').textContent=introMode?'Brief only':stage===1?'One-shot prompt':'Refinement prompt';
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
 const journey=introMode?'original':'ingredients',previousJourney=document.documentElement.dataset.journey;
 document.documentElement.dataset.journey=journey;$('#reset').hidden=introMode;
 // In the plain step the dice are away; they keep their last names so an exit never shows placeholder labels.
 if(!introMode){$('#ingredient-a').textContent=INGREDIENTS_A[a];$('#ingredient-b').textContent=INGREDIENTS_B[b];}
 matrixButtons.forEach((button,id)=>{button.setAttribute('aria-pressed',String(!introMode&&id===selected.id));const run=currentExperiment().runs.find(item=>item.id===id);button.setAttribute('aria-label',run.label+' — '+attemptName(stage));});
 matrixCells.forEach((cell,id)=>{
  cell.hidden=Number(id.split('-')[0])!==a;if(cell.hidden)return;
  const item=currentExperiment().runs.find(run=>run.id===id).steps[stage-1],frame=cell.querySelector('iframe');
  if(frame.dataset.file!==item.file){frame.srcdoc=item.html;frame.dataset.file=item.file;}
 });
 $('#atlas-ingredient').value=String(a);
 renderResult();if(sync)syncDice3D();updateURL();
 if(previousJourney&&previousJourney!==journey&&view==='dice')moveDice(!introMode);
 $('#status').textContent=introMode?'Brief only. Roll the dice to add two ingredients.':selected.label+'. '+attemptName(stage)+'.';
}
function selectPair(run){settlePresentation();introMode=false;ingredientsChosen=true;cancelDiceRoll();selected=currentExperiment().runs.find(item=>item.id===run.id);render();}
function chooseDieFace(index,value){
 settlePresentation();const introducing=introMode;introMode=false;ingredientsChosen=true;
 if(introducing){stage=1;comparing=false;}
 const values=[selected.a,selected.b];values[index]=value;
 // A deliberate choice keeps the other face, even on the first interaction.
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 render(false);settleDieGrab(index,true);syncDice3D();
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
function roll(index,gesture=null,forced=null){
 settlePresentation();
 const introduce=introMode;introMode=false;ingredientsChosen=true;
 if(introduce){stage=1;comparing=false;}
 const before=selected,indices=introduce?[0,1]:index===0||index===1?[index]:[0,1],values=[before.a,before.b];
 // The demo passes authored faces; every visitor roll stays random.
 indices.forEach(i=>{values[i]=forced?.[i]??(introduce?randomIndex(i?INGREDIENTS_B.length:INGREDIENTS_A.length):nextIngredient(i,values[i]));});
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 // Selection is immediate. The dice acknowledge it without gating the report.
 render(false);
 tumbleDice(indices,values,()=>{syncDice3D();},gesture);
}
async function copyText(text,pre,status){
 try{await navigator.clipboard.writeText(text);status.textContent='Copied.';}catch{pre.hidden=false;pre.textContent=text;const details=pre.closest?.('details');if(details)details.open=true;const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Text selected. Press Ctrl+C or use Copy.';}
}
$('#compare').addEventListener('click',()=>{if(introMode)return;comparing=!comparing;renderResult();updateURL();});
$('#compare-target').addEventListener('change',event=>{comparison=event.target.value==='other'?'other':'plain';renderResult();updateURL();});
function changeMethod(next){settlePresentation();method=next;promptPeeks.forEach(peek=>peek.close());selected=currentExperiment().runs.find(run=>run.id===selected.id);render();if(view==='plain')renderPlain();}
$('#method-original').addEventListener('click',()=>changeMethod('original'));
$('#method-stronger').addEventListener('click',()=>changeMethod('stronger'));
$('#plain-method').addEventListener('change',event=>changeMethod(event.target.value==='original'?'original':'stronger'));
function setAttempt(value){if(introMode)return;settlePresentation();const next=Math.round(Number(value));if(selected.steps[next-1]){stage=next;render(false);}}
$('#stage-0').addEventListener('click',showBrief);
for(let value=1;value<=4;value++)$('#stage-'+value).addEventListener('click',()=>{
 if(introMode){if(value===1)showIngredients();}
 else setAttempt(value);
});
$('#experiment-next').addEventListener('click',nextExperimentStep);
$('#reset').addEventListener('click',()=>{showBrief();$('#experiment-next').focus({preventScroll:true});});
function settleControlMotion(){actionAnimations.forEach(animation=>animation.cancel());actionAnimations.clear();syncRailMarker();}
document.addEventListener('visibilitychange',()=>{if(document.hidden){settlePresentation();settleControlMotion();}});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{settlePresentation();settleControlMotion();});
$('#copy-prompt').addEventListener('click',()=>copyText((introMode?currentBaseline().steps[0]:selected.steps[stage-1]).fullPrompt,$('#current-prompt'),$('#copy-status')));
$('#refinement-prompt').textContent=EXPERIMENT.refinementPrompt;
const exportPrompt=document.createElement('pre');exportPrompt.hidden=true;$('#export-status').after(exportPrompt);
$('#copy-plain').addEventListener('click',()=>copyText(EXPERIMENT.plain.fullPrompt,exportPrompt,$('#export-status')));
$('#copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#share-status').textContent='Copied';}catch{$('#share-status').textContent='Copy the address to share this roll.';}});
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
 settlePresentation();
 promptPeeks.forEach(peek=>peek.close());
 cancelDiceRoll();view=next==='dice'?'dice':'plain';document.documentElement.dataset.view=view;
 ['#dice-lab','#stage-bar','#experiment-tools','#dice-deck','#atlas','#refinement-rail','#story'].forEach(id=>$(id).hidden=view!=='dice');
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
initDice3D();buildMatrix();render();selectView(view);
