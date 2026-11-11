const $=s=>document.querySelector(s);
const params=new URLSearchParams(location.search);
let method=params.get('model')==='newer'?'newer':params.get('prompt')==='original'?'original':'stronger';
// Three recorded tracks: the earlier model with its two refinement prompts, and a newer-model
// rerun of the whole experiment with identical prompts.
let promptTrack=method==='original'?'original':'stronger';
const currentExperiment=()=>method==='newer'?NEWER_EXPERIMENT:method==='original'?EXPERIMENT:STRONGER_EXPERIMENT;
const currentBaseline=()=>method==='newer'?NEWER_BASELINE:method==='original'?BASELINE:STRONGER_BASELINE;
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
// halfway: the first die has landed; the page waits for the second ingredient.
let ingredientsChosen=!introMode,paintedStep=null,halfway=false;
// The last thing the visitor did to the dice or grid. The narration says it back, so breaking the
// story's order still explains where you are. Moving through the passes clears it.
let lastEvent=null;
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
 const moving=animate&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 // The timeline advances once the page has begun to change, not at the same instant as the press.
 marker.style.transitionDuration=moving?'380ms':'0ms';marker.style.transitionDelay=moving?'260ms':'0ms';
 // The line runs from the first node's centre to the current node's centre.
 const first=$('#stage-0').getBoundingClientRect?.()||target,start=first.left+first.width/2;
 marker.style.width=Math.max(0,target.left+target.width/2-start)+'px';marker.style.transform='translateX('+(start-track.left)+'px)';
}
const railResize=new ResizeObserver(()=>syncRailMarker());railResize.observe($('#rail-stops'));
function settlePresentation(){settleReportHandoff($('#report-view'));settleReportHandoff($('#plain-report'));}
// The page tells its story in one headline per step; every step stays reachable from the chapters.
const storyBeats=[
 ['You just generated a report.','One prompt, no ingredients: “Create a one-page website that helps its owner understand this week’s website performance.”'],
 ['Now add randomness.','Same prompt, plus two ingredients.'],
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
 // A new beat rises into place; the line under it follows a moment later.
 if(changed&&paintedStep!==null&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)[['#story-title',0],['#story-text',50]].forEach(([id,delay])=>$(id).animate?.([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:280,delay,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'}));
}
// The dice are thrown in from either side when ingredients are added and roll back out on reset.
// The slide spans the tumble's flight and bounces, so each die stops spinning as it arrives.
const DICE_THROW={enter:[{direction:1,strength:.8},{direction:-1,strength:.8}],exit:[{direction:-1,strength:.55},{direction:1,strength:.55}]};
const LABEL_LAND={roll:250,enter:330};
let diceStageAnimations=[];
const labelAnimations=new Map();
function landLabels(indices,delay){
 if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 // The name clears when the die leaves the table and rises in as it makes first contact.
 indices.forEach(i=>{
  const label=$('#ingredient-'+(i?'b':'a'));if(!label?.animate)return;
  labelAnimations.get(i)?.cancel();
  labelAnimations.set(i,label.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'none'}],{duration:240,delay,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'}));
 });
}
function moveDice(entering,which=[0,1]){
 diceStageAnimations.forEach(animation=>animation.cancel());diceStageAnimations=[];
 document.querySelectorAll('.die').forEach(die=>die.classList.toggle('leaving',false));
 if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let moved=false;
 document.querySelectorAll('.die').forEach((die,i)=>{
  if(!which.includes(i))return;
  const object=die.querySelector('.die-object'),label=die.querySelector('strong'),rect=object?.getBoundingClientRect?.();
  if(!rect?.width||!object.animate)return;
  if(!entering)die.classList.toggle('leaving',true);
  moved=true;
  const away=i?Math.max(180,innerWidth-rect.left+24):-Math.max(180,rect.right+24);
  if(entering){
   diceStageAnimations.push(object.animate([{transform:`translateX(${away}px)`},{transform:'translateX(0)'}],{duration:560,delay:which.length>1?i*50:0,easing:'cubic-bezier(.2,.8,.25,1)',fill:'backwards'}));
  }else{
   const exit=object.animate([{transform:'translateX(0)'},{transform:`translateX(${away}px)`}],{duration:460,delay:i*40,easing:'cubic-bezier(.55,0,.75,.2)',fill:'forwards'});
   diceStageAnimations.push(exit,label.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease-in',fill:'forwards'}));
   if(i===which.at(-1))exit.onfinish=()=>{if(diceStageAnimations.includes(exit)){document.querySelectorAll('.die').forEach(die=>die.classList.toggle('leaving',false));diceStageAnimations.forEach(animation=>animation.cancel());diceStageAnimations=[];}};
  }
 });
 if(moved&&!entering)tumbleDice(which,[a,b],()=>{},DICE_THROW.exit);
}
// Pointing labels name what can be done with an object, beside the object. The die label stays
// until a die has been rolled; the demo can point at other things with the same label.
const pointer={custom:null,dieHintUsed:false,key:''};
// Each step names its next action beside the control that does it, so the instructions follow through.
// The story cards: what just happened, said to the visitor, with the next move inside the card.
// Clicking a card does that move, so the story can be followed without finding a button.
function pointerSpec(){
 if(pointer.custom)return pointer.custom;
 if(view!=='dice'||comparing)return null;
 const next=$('#experiment-next'),first=INGREDIENTS_A[a],second=INGREDIENTS_B[b],pair=first+' × '+second;
 const rollFirst={label:'Roll the first die',run:()=>roll(0)},rollSecond={label:'Roll the second die',run:()=>roll(1)};
 const refine={label:stage===1?'Refine it':stage===2?'Refine again':'One more pass',run:()=>nextExperimentStep()};
 if(introMode&&!halfway){
  if(lastEvent?.kind==='reset')return {target:$('#dice-lab'),title:'Fresh start.',sub:'The same one-prompt report, no ingredients. Roll for a new pair.',side:'right',action:rollFirst};
  return {target:$('#dice-lab'),title:'You just generated a report.',sub:'One prompt, no ingredients. Tidy, sensible, and roughly what everyone gets. Now try adding randomness.',side:'right',action:rollFirst};
 }
 if(introMode){
  const title=lastEvent?.kind==='swap'?'Swapped for '+first+'.':lastEvent?.kind==='choose'?'You picked '+first+'.':'You added '+first+'.';
  return {target:$('#ingredient-a'),title,sub:'One more ingredient and the page changes. Roll the second die.',side:'below',action:rollSecond};
 }
 if(lastEvent&&(lastEvent.kind==='swap'||lastEvent.kind==='choose')){
  const title=(lastEvent.kind==='swap'?'Swapped in ':'You picked ')+lastEvent.name+'.';
  const sub=stage===1?'Same prompt, a different mix: '+pair+'. That is a whole new page.':'Now '+pair+', pass '+(stage-1)+'. These refinements belong to this pair, not the last one.';
  return {target:next,title,sub,side:'right',action:stage<4?refine:null};
 }
 if(lastEvent?.kind==='pick')return {target:next,title:'You picked '+pair+'.',sub:'Same prompt, its own page. Refine it, or roll a die from here.',side:'right',action:stage<4?refine:null};
 if(stage===1)return {target:next,title:pair+'.',sub:'Same prompt, two odd ingredients, a whole new page. Now push it.',side:'right',action:refine};
 if(selected.steps[stage-1].html===selected.steps[stage-2].html)return {target:next,title:'Nothing changed this pass.',sub:'The model looked at its own page and kept it. That happens.',side:'right',action:stage<4?refine:null};
 if(stage===2)return {target:next,title:'Refined once.',sub:'The model critiqued its own page, then leaned harder into '+first+' and '+second+'.',side:'right',action:refine};
 if(stage===3)return {target:next,title:'Twice.',sub:'Same prompt, run on its own result. Watch what it keeps and what it drops.',side:'right',action:refine};
 return {target:next,title:'Three passes in.',sub:'More distinct, or just more? Easier to judge side by side.',side:'right',action:{label:'Compare with no dice',run:()=>$('#compare').click()}};
}
// The die waiting to be rolled carries a floating "Click me" above it.
function updateDieCall(){
 const chip=$('#die-call'),index=view==='dice'&&introMode&&!comparing?(halfway?1:0):-1,stageBox=document.querySelector('.workbench');
 if(index<0||!stageBox?.getBoundingClientRect){chip.hidden=true;document.querySelectorAll('.die').forEach(die=>die.removeAttribute?.('data-waiting'));return;}
 const column=document.querySelectorAll('.die')[index],object=column?.querySelector('.die-object');
 if(!column?.getBoundingClientRect||!object){chip.hidden=true;return;}
 chip.hidden=false;
 // The waiting die idles with an occasional hop (CSS, with long rests); the other stays still.
 document.querySelectorAll('.die').forEach((die,i)=>die.toggleAttribute?.('data-waiting',i===index));
 const box=stageBox.getBoundingClientRect(),rect=column.getBoundingClientRect(),objectBox=object.getBoundingClientRect(),size=column.querySelector('.cube')?.offsetWidth||100,own=chip.getBoundingClientRect();
 const x=Math.round(rect.left+rect.width/2-box.left-own.width/2),y=Math.round(objectBox.top+objectBox.height/2-size*.95-box.top-own.height-14);
 chip.style.left=x+'px';chip.style.top=y+'px';
}
// The label arrives in the order the eye should travel: a dot lands on the target, the leader draws out
// from it, then the card settles at the end of the line. It waits for the change it follows to finish.
let pointerAnimations=[];
function updatePointer(delay=0){
 updateDieCall();
 const note=$('#pointer-note'),spec=pointerSpec(),stageBox=document.querySelector('.workbench');
 if(!spec||!spec.target?.getBoundingClientRect||!stageBox?.getBoundingClientRect){pointerAnimations.forEach(animation=>animation.cancel());note.hidden=true;pointer.key='';return;}
 const key=spec.title+spec.sub+spec.side,changed=pointer.key!==key;
 if(changed){
  pointerAnimations.forEach(animation=>animation.cancel());pointerAnimations=[];$('#pointer-text').textContent=spec.title;$('#pointer-sub').textContent=spec.sub||'';note.dataset.side=spec.side;
  const action=$('#pointer-action'),card=document.querySelector('.pointer-card');action.hidden=!spec.action;action.textContent=spec.action?(spec.action.label+' →'):'';pointer.action=spec.action?.run||null;
  if(card){if(spec.action){card.setAttribute('role','button');card.tabIndex=0;card.setAttribute('aria-label',spec.title+' '+spec.action.label);}else{card.removeAttribute('role');card.removeAttribute('tabindex');card.removeAttribute('aria-label');}card.dataset.actionable=String(!!spec.action);}
 }
 note.hidden=false;
 // A die is placed from its column, which never moves sideways, so a label set during a throw or entrance
 // lands where the die will rest. Entrances only move dice sideways, so the height comes from the die's box.
 const column=spec.target.classList?.contains('cube')?spec.target.closest('.die'):null;
 let target;
 if(column){const rect=column.getBoundingClientRect(),object=column.querySelector('.die-object'),size=spec.target.offsetWidth||100,objectBox=object?.getBoundingClientRect(),middle=objectBox?objectBox.top+objectBox.height/2:rect.top+rect.height/2,centre=rect.left+rect.width/2;target={left:centre-size/2,right:centre+size/2,top:middle-size*.92,bottom:middle+size*.5};}
 else target=spec.target.getBoundingClientRect();
 const width=target.right-target.left,height=target.bottom-target.top;
 const box=stageBox.getBoundingClientRect(),own=note.getBoundingClientRect(),leader=32;
 let x=Math.round(spec.side==='left'?target.left-box.left-leader-own.width:spec.side==='right'?target.right-box.left+leader:target.left+width/2-box.left-own.width/2);
 let y=Math.round(spec.side==='above'?target.top-box.top-own.height-leader:spec.side==='below'?target.bottom-box.top+leader:spec.side==='right'&&height<90?target.top-box.top+height/2-31:target.top+height/2-box.top-own.height/2);
 // Keep the whole card readable inside the window, whatever it points at.
 x=Math.max(12-box.left,Math.min(x,innerWidth-box.left-own.width-12));y=Math.max(12-box.top,y);
 note.style.transform=`translate(${x}px,${y}px)`;
 if(!changed)return;
 pointer.key=key;
 const card=note.querySelector?.('.pointer-card'),line=note.querySelector?.('.pointer-leader'),dot=note.querySelector?.('.pointer-dot');
 if(!card?.animate||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const ease='cubic-bezier(.23,1,.32,1)',along=spec.side==='above'?'scaleY':'scaleX',drift=spec.side==='left'?'translateX(-8px)':spec.side==='right'?'translateX(8px)':'translateY(-6px)';
 pointerAnimations=[
  dot.animate([{transform:'translate(-50%,-50%) scale(0)'},{transform:'translate(-50%,-50%) scale(1.25)',offset:.7},{transform:'translate(-50%,-50%) scale(1)'}],{duration:240,delay,easing:ease,fill:'backwards'}),
  line.animate([{transform:along+'(0)'},{transform:along+'(1)'}],{duration:240,delay:delay+110,easing:ease,fill:'backwards'}),
  card.animate([{opacity:0,transform:drift},{opacity:1,transform:'none'}],{duration:300,delay:delay+260,easing:ease,fill:'backwards'})
 ];
}
const pointerCard=document.querySelector('.pointer-card');
pointerCard?.addEventListener('click',()=>pointer.action?.());
pointerCard?.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&pointer.action){event.preventDefault();pointer.action();}});
function showPointer(target,title,sub='',side='above'){pointer.custom={target,title,sub,side};updatePointer();}
function clearPointer(){pointer.custom=null;updatePointer();}
window.addEventListener('resize',()=>updatePointer());
// An ingredient's name carries a face slug, so it can be set in the type that ingredient brings.
function setDieCall(index){const label=$('#ingredient-'+(index?'b':'a'));label.textContent='';label.dataset.face='call';}
function setIngredientLabel(index,name){const label=$('#ingredient-'+(index?'b':'a'));label.textContent=name;label.dataset.face=name.toLowerCase().replace(/[^a-z]+/g,'-');}
function showBrief(){if(introMode&&!halfway)return;settlePresentation();cancelDiceRoll();introMode=true;halfway=false;lastEvent={kind:'reset'};stage=1;comparing=false;render();}
// A visitor's first roll of the visit is celebrated once; the demo's authored rolls never count.
let firstRollCelebrated=false;
function celebrateFirstRoll(impact,forced){if(forced!=null||firstRollCelebrated)return;firstRollCelebrated=true;impact.celebrate=true;}
// The first ingredient lands alone. Every saved page needs both, so the plain page stays until the second.
function addFirstIngredient(forced=null){
 settlePresentation();const swapping=halfway;halfway=true;ingredientsChosen=true;
 const value=forced??randomIndex(INGREDIENTS_A.length);
 lastEvent={kind:swapping?'swap':'add',index:0,name:INGREDIENTS_A[value]};
 selected=currentExperiment().runs.find(run=>run.a===value&&run.b===selected.b);
 const impact=reportImpactFor(()=>render(false));celebrateFirstRoll(impact,forced);
 tumbleDice([0],[value,selected.b],()=>{syncDice3D();},DICE_THROW.enter,impact);
 landLabels([0],LABEL_LAND.enter);
}
function showIngredients(){
 if(!ingredientsChosen){roll();return;}
 settlePresentation();introMode=false;stage=1;render();
}
// The press sinks, then the button springs up past its rest and settles: the next pass is on its way.
function fireNextButton(){
 const button=$('#experiment-next');button.classList.toggle('is-firing',false);void button.offsetWidth;button.classList.toggle('is-firing',true);
 if(!button.animate||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 button.animate([{translate:'0 3px'},{translate:'0 -7px',offset:.3},{translate:'0 1.5px',offset:.6},{translate:'0 -.5px',offset:.82},{translate:'0 0'}],{duration:520,easing:'cubic-bezier(.33,1,.68,1)'});
 if(typeof playRefineStamp==='function'&&!introMode&&stage<4)playRefineStamp();
}
function nextExperimentStep(){
 promptPeeks.forEach(peek=>peek.close());fireNextButton();
 if(introMode){if(halfway)roll();else addFirstIngredient();}
 else if(stage<4){setAttempt(stage+1);}
 else{stage=1;comparing=false;roll();}
}
function updateURL(){
 const query=new URLSearchParams({view,pair:selected.id,stage:String(stage),plainStage:String(plainStage)});
 if(method==='newer')query.set('model','newer');else query.set('prompt',method);
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
  section.querySelector('iframe').title=label||(/^(stronger-|newer-)?plain-/.test(item.file)?'Plain weekly report':selected.label);
  section.style.order=String(order);section.hidden=false;
  const frame=section.querySelector('iframe');if(frame.dataset.loaded==='true')scrollReport(frame,reportScroll.get(container)||0);
  if(entries.length===1&&!label&&previous.length===1&&previous[0]!==section){
   handoffReport(container,previous[0],section);
   // The new page settles into place as the old one is wiped away: a small drop, not a slide.
   if(section.animate&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)section.animate([{transform:'translateY(-12px) scale(.985)'},{transform:'none'}],{duration:560,easing:'cubic-bezier(.23,1,.32,1)'});
  }
 });
}
// Before and after: a small handle at the top of the page wipes the previous step back in from the
// left, as far as it is dragged. It appears once the page has changed, and nudges itself once to show how.
const beforeAfter={value:0,item:null,section:null,tween:null,taught:false,drag:null};
function beforeItem(){
 if(view!=='dice'||introMode||comparing)return null;
 const before=stage===1?currentBaseline().steps[0]:selected.steps[stage-2],now=selected.steps[stage-1];
 return before&&before.html!==now.html?before:null;
}
function paintBeforeAfter(value){
 const box=$('#before-after'),handle=$('#ba-handle'),container=$('#report-view');
 beforeAfter.value=Math.max(0,Math.min(1,value));
 box.style.setProperty('--ba',beforeAfter.value.toFixed(4));
 box.toggleAttribute?.('data-active',beforeAfter.value>0);
 const percent=Math.round(beforeAfter.value*100);
 handle.setAttribute('aria-valuenow',String(percent));
 handle.setAttribute('aria-valuetext',percent?percent+'% of the previous step shown':'Current step');
 let section=beforeAfter.section;
 if(beforeAfter.value>0&&beforeAfter.item){
  if(!section){
   const cache=previewCaches.get(container);section=cache?.get(beforeAfter.item.file);
   if(!section){section=addReport(container,beforeAfter.item,'');cache?.set(beforeAfter.item.file,section);}
   beforeAfter.section=section;section.classList.toggle('report-before',true);section.inert=true;section.setAttribute('aria-hidden','true');
   const frame=section.querySelector('iframe');if(frame?.dataset.loaded==='true')scrollReport(frame,reportScroll.get(container)||0);
  }
  section.hidden=false;section.style.clipPath=`inset(0 ${((1-beforeAfter.value)*100).toFixed(3)}% 0 0)`;
 }else if(section)releaseBeforeSection();
}
function releaseBeforeSection(){
 const section=beforeAfter.section;if(!section)return;
 beforeAfter.section=null;section.hidden=true;section.style.clipPath='';section.inert=false;section.removeAttribute('aria-hidden');section.classList.toggle('report-before',false);
}
function stopBeforeAfterTween(){if(beforeAfter.tween){cancelAnimationFrame(beforeAfter.tween);beforeAfter.tween=null;}}
// Glide to a value; the shape(t) maps progress to position for the one-time nudge.
function tweenBeforeAfter(to,duration=360,shape=null){
 stopBeforeAfterTween();
 if(typeof requestAnimationFrame!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden){paintBeforeAfter(shape?0:to);return;}
 const from=beforeAfter.value,start=performance.now(),ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
 const step=now=>{const t=Math.min(1,(now-start)/duration);paintBeforeAfter(shape?shape(t):from+(to-from)*ease(t));beforeAfter.tween=t<1?requestAnimationFrame(step):null;};
 beforeAfter.tween=requestAnimationFrame(step);
}
// Called around each render: the before page is released first, so the render sees only the
// current page, then shown again at the same position if the step has not changed.
function renderBeforeAfter(){
 const item=beforeItem(),box=$('#before-after');
 if(item!==beforeAfter.item){stopBeforeAfterTween();beforeAfter.item=item;paintBeforeAfter(0);}
 else paintBeforeAfter(beforeAfter.value);
 box.hidden=!item;
}
// After the first change has printed, the handle peeks a sliver of the previous page and returns.
function reportHandoffSettled(container){
 if(container!==$('#report-view')||beforeAfter.taught||!beforeAfter.item||beforeAfter.value)return;
 beforeAfter.taught=true;
 tweenBeforeAfter(0,1500,t=>t<.42?.22*(1-(1-t/.42)**3):t<.58?.22:.22*(1-((t-.58)/.42)**2*(3-2*(t-.58)/.42)));
}
(()=>{
 const handle=$('#ba-handle'),box=$('#before-after');
 const valueAt=x=>{const rect=$('#report-view').getBoundingClientRect?.();return rect?.width?(x-rect.left)/rect.width:beforeAfter.value;};
 handle.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  settlePresentation();stopBeforeAfterTween();beforeAfter.taught=true;
  beforeAfter.drag={id:event.pointerId,x:event.clientX,moved:false,from:beforeAfter.value};
  handle.setPointerCapture?.(event.pointerId);box.toggleAttribute?.('data-dragging',true);
 });
 handle.addEventListener('pointermove',event=>{
  const drag=beforeAfter.drag;if(!drag||event.pointerId!==drag.id)return;
  if(!drag.moved&&Math.abs(event.clientX-drag.x)<4)return;
  drag.moved=true;event.preventDefault?.();paintBeforeAfter(valueAt(event.clientX));
 });
 const end=event=>{
  const drag=beforeAfter.drag;if(!drag||event.pointerId!==drag.id)return;
  beforeAfter.drag=null;box.toggleAttribute?.('data-dragging',false);
  // A tap without a drag opens the comparison halfway, or closes it.
  if(!drag.moved)tweenBeforeAfter(drag.from>0?0:.5);
 };
 handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
 handle.addEventListener('keydown',event=>{
  const steps={ArrowRight:.05,ArrowUp:.05,ArrowLeft:-.05,ArrowDown:-.05,PageUp:.25,PageDown:-.25};
  let next=null;
  if(event.key in steps)next=beforeAfter.value+steps[event.key];
  else if(event.key==='Home'||event.key==='Escape')next=0;else if(event.key==='End')next=1;
  else if(event.key==='Enter'||event.key===' ')next=beforeAfter.value>0?0:.5;
  if(next===null)return;
  event.preventDefault();settlePresentation();beforeAfter.taught=true;
  if(event.key==='Enter'||event.key===' ')tweenBeforeAfter(next);else{stopBeforeAfterTween();paintBeforeAfter(next);}
 });
})();
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
  const button=$('#stage-'+n);button.setAttribute('aria-pressed',String(n===value));button.setAttribute('data-done',String(n<value));
  button.disabled=introMode&&n>1;
 }
 const refining=!introMode&&stage<4;
 const label=introMode?(halfway?'Add another':'Add randomness'):stage===1?'Refine it':stage===2?'Refine again':stage===3?'One more pass':'Roll a new pair';
 $('#experiment-next').dataset.passes=String(introMode?0:stage-1);
 const cue=refining?'+'+stage:'→';
 $('#experiment-next').dataset.action=refining?'refine':'roll';
 $('#experiment-next').setAttribute('aria-label',refining?label+'. Refinement '+stage:label);
 updateActionText($('#next-label'),label,animate);updateActionText($('#next-cue'),cue,animate);
 showStory();syncRailMarker(animate);paintedStep=value;
}
function renderResult(){
 stopBeforeAfterTween();releaseBeforeSection();
 const container=$('#report-view');container.classList.toggle('comparing',comparing);
 const current=introMode?currentBaseline().steps[0]:selected.steps[stage-1];
 // "Other" is each track's one alternative: the earlier model's two prompts compare with each
 // other from a shared one-shot; the newer model compares with the earlier original-prompt run.
 const other=(method==='original'?STRONGER_EXPERIMENT:EXPERIMENT).runs.find(run=>run.id===selected.id).steps[stage-1];
 const currentLabel=method==='newer'?'Newer model':method==='stronger'?'Stronger prompt':'Original prompt';
 const otherLabel=method==='newer'?'Earlier model':method==='stronger'?'Original prompt':'Stronger prompt';
 let entries=[{item:current,label:''}];
 if(comparing&&comparison==='plain')entries=[{item:currentBaseline().steps[stage-1],label:'No ingredients'},{item:current,label:'+ Two ingredients'}];
 if(comparing&&comparison==='other')entries=stage===1&&method!=='newer'?[{item:current,label:'Shared one-shot'}]:method==='original'?[{item:current,label:currentLabel},{item:other,label:otherLabel}]:[{item:other,label:otherLabel},{item:current,label:currentLabel}];
 if(introMode)entries=[{item:current,label:''}];
 container.classList.toggle('comparing',entries.length>1);document.documentElement.dataset.comparing=String(entries.length>1);
 container.dataset.passes=String(!introMode&&entries.length===1?stage-1:0);
 showReports(container,entries);
 renderBeforeAfter();
 $('#pair-title').textContent=introMode?'No ingredients':selected.label;
 $('#compare').disabled=introMode;
 $('#compare').setAttribute('aria-pressed',String(comparing));
 $('#compare').setAttribute('aria-label',comparing&&comparison==='other'?(method==='newer'?'Compare model generations':'Compare refinement prompts'):'Compare with no ingredients');
 $('#compare-target').hidden=introMode||!comparing;$('#compare-target').value=comparison;$('#compare-other').textContent=otherLabel;
 $('#view-plain').disabled=false;$('#view-plain').textContent='Refine brief alone →';
 $('#method-original').setAttribute('aria-pressed',String(method==='original'));$('#method-stronger').setAttribute('aria-pressed',String(method==='stronger'));$('#method-newer').setAttribute('aria-pressed',String(method==='newer'));
 $('#model-toggle').setAttribute('aria-pressed',String(method==='newer'));
 $('#method-note').hidden=stage!==1;
 $('#method-note').textContent=method==='newer'?'Same prompts, a newer model, its own one-shot.':'Both prompts start from this one-shot.';
 renderRail();
 showPrompt($('#current-prompt'),current.prompt,!introMode&&stage===1?`Combine ${INGREDIENTS_A[a]} and ${INGREDIENTS_B[b]} into a distinct visual identity.`:'');
 $('#prompt-title').textContent=introMode?'Prompt, no ingredients':stage===1?'One-shot prompt':'Refinement prompt';
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
 const journey=introMode?(halfway?'half':'original'):'ingredients',previousJourney=document.documentElement.dataset.journey;
 document.documentElement.dataset.journey=journey;$('#reset').hidden=journey==='original';
 // In the plain step the dice are away; they keep their last names so an exit never shows placeholder labels.
 // A die that is waiting to be rolled says so; a rolled die shows its ingredient in that ingredient's type.
 if(!introMode||halfway)setIngredientLabel(0,INGREDIENTS_A[a]);else setDieCall(0);
 if(!introMode)setIngredientLabel(1,INGREDIENTS_B[b]);else setDieCall(1);
 matrixButtons.forEach((button,id)=>{button.setAttribute('aria-pressed',String(!introMode&&id===selected.id));const run=currentExperiment().runs.find(item=>item.id===id);button.setAttribute('aria-label',run.label+' — '+attemptName(stage));});
 matrixCells.forEach((cell,id)=>{
  cell.hidden=Number(id.split('-')[0])!==a;if(cell.hidden)return;
  const item=currentExperiment().runs.find(run=>run.id===id).steps[stage-1],frame=cell.querySelector('iframe');
  if(frame.dataset.file!==item.file){frame.srcdoc=item.html;frame.dataset.file=item.file;}
 });
 $('#atlas-ingredient').value=String(a);
 renderResult();if(sync)syncDice3D();updateURL();
 const entering=previousJourney!==journey&&journey!=='original'&&view==='dice';
 // Beat order: the press, then the page or dice, then the timeline, then the next label.
 updatePointer(entering?900:paintedStep===null?500:760);
 if(previousJourney&&previousJourney!==journey&&view==='dice'){
  const order=['original','half','ingredients'],from=order.indexOf(previousJourney),to=order.indexOf(journey);
  if(from===1&&to===2){/* the second die is already on the table */}
  // Dice enter one at a time as the story adds them, and leave together on reset.
  // The first die waits on the plain page; the second enters when the first has landed, and leaves on reset.
  if(from===0&&to>0)moveDice(true,[1]);else if(to===0&&from>0)moveDice(false,[1]);
 }
 $('#status').textContent=introMode?(halfway?'First ingredient: '+INGREDIENTS_A[a]+'. Add a second to make the page.':'The report with no ingredients. Roll the dice to add two.'):selected.label+'. '+attemptName(stage)+'.';
}
function selectPair(run){settlePresentation();introMode=false;halfway=false;lastEvent={kind:'pick'};ingredientsChosen=true;cancelDiceRoll();selected=currentExperiment().runs.find(item=>item.id===run.id);render();}
function chooseDieFace(index,value){
 settlePresentation();pointer.dieHintUsed=true;
 if(introMode&&halfway&&index===0){selected=currentExperiment().runs.find(run=>run.a===value&&run.b===selected.b);lastEvent={kind:'choose',index:0,name:INGREDIENTS_A[value]};render(false);settleDieGrab(index,true);syncDice3D();return;}
 const introducing=introMode;introMode=false;halfway=false;ingredientsChosen=true;
 if(introducing){stage=1;comparing=false;}
 const values=[selected.a,selected.b];values[index]=value;
 lastEvent={kind:'choose',index,name:index?INGREDIENTS_B[value]:INGREDIENTS_A[value]};
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
 // On the plain page the first die is the action: it lands alone, then the second die joins.
 if(introMode&&!halfway&&index===0){addFirstIngredient(forced?.[0]);return;}
 if(introMode&&!halfway&&index===1)return;
 if(introMode&&halfway&&index===0){addFirstIngredient(forced?.[0]??nextIngredient(0,selected.a));return;}
 settlePresentation();
 const introduce=introMode,completing=introduce&&halfway;introMode=false;halfway=false;ingredientsChosen=true;
 if(introduce){stage=1;comparing=false;}
 if(index===0||index===1)pointer.dieHintUsed=true;
 const before=selected,indices=completing?[1]:introduce?[0,1]:index===0||index===1?[index]:[0,1],values=[before.a,before.b];
 const announce=completing||index===0||index===1;
 // The demo passes authored faces; every visitor roll stays random.
 indices.forEach(i=>{values[i]=forced?.[i]??(introduce?randomIndex(i?INGREDIENTS_B.length:INGREDIENTS_A.length):nextIngredient(i,values[i]));});
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 if(completing)lastEvent={kind:'pair'};
 else if(announce){const i=indices[0];lastEvent={kind:'swap',index:i,name:i?INGREDIENTS_B[values[1]]:INGREDIENTS_A[values[0]]};}
 else lastEvent={kind:'pair'};
 // Selection is immediate; only the old page's cover waits for the die to reach the page.
 const impact=reportImpactFor(()=>render(false));celebrateFirstRoll(impact,forced);
 tumbleDice(indices,values,()=>{syncDice3D();},gesture||(introduce?DICE_THROW.enter:null),impact);
 landLabels(indices,introduce?LABEL_LAND.enter:LABEL_LAND.roll);
}
async function copyText(text,pre,status){
 try{await navigator.clipboard.writeText(text);status.textContent='Copied.';}catch{pre.hidden=false;pre.textContent=text;const details=pre.closest?.('details');if(details)details.open=true;const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Text selected. Press Ctrl+C or use Copy.';}
}
$('#compare').addEventListener('click',()=>{if(introMode)return;comparing=!comparing;renderResult();updateURL();});
$('#compare-target').addEventListener('change',event=>{comparison=event.target.value==='other'?'other':'plain';renderResult();updateURL();});
function changeMethod(next){settlePresentation();method=next;if(next!=='newer')promptTrack=next;promptPeeks.forEach(peek=>peek.close());selected=currentExperiment().runs.find(run=>run.id===selected.id);render();if(view==='plain')renderPlain();}
$('#method-original').addEventListener('click',()=>changeMethod('original'));
$('#method-stronger').addEventListener('click',()=>changeMethod('stronger'));
$('#method-newer').addEventListener('click',()=>changeMethod('newer'));
$('#model-toggle').addEventListener('click',()=>changeMethod(method==='newer'?promptTrack:'newer'));
$('#plain-method').addEventListener('change',event=>changeMethod(event.target.value==='newer'?'newer':event.target.value==='original'?'original':'stronger'));
function setAttempt(value){if(introMode)return;settlePresentation();lastEvent=null;const next=Math.round(Number(value));if(selected.steps[next-1]){stage=next;render(false);}}
$('#stage-0').addEventListener('click',showBrief);
for(let value=1;value<=4;value++)$('#stage-'+value).addEventListener('click',()=>{
 if(introMode){if(value===1)showIngredients();}
 else setAttempt(value);
});
$('#experiment-next').addEventListener('click',nextExperimentStep);
$('#experiment-next').addEventListener('animationend',()=>$('#experiment-next').classList.toggle('is-firing',false));
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
initDice3D();if(typeof initDiceSound==='function')initDiceSound();buildMatrix();render();selectView(view);
