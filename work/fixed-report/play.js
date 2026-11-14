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
let ingredientsChosen=!introMode,paintedStep=null;
// The page shows one pass of the experiment. By default that is the third refinement, with and without the
// ingredients, and the passes themselves stay out of the way; About the experiment can bring them back.
const SHOWN=4;
let passes=params.get('passes')==='1';
document.documentElement.dataset.passes=String(passes);
function plainItem(){const steps=currentBaseline().steps;return steps[passes?0:Math.min(SHOWN,steps.length)-1];}
// One throw adds one ingredient. After the first, the second die comes in at rest with no name yet and waits to
// be thrown. Every saved page used two ingredients, so until then the page pairs the first ingredient with the
// face that die happens to show; the sentence above the page keeps its second gap open.
let secondWaits=false;
// The action, the step dots, Compare and Reset arrive after the first result has been seen, not with it. `ready`
// latches for the visit. Nothing here runs on a clock: the controls come when the first reveal has played out,
// or at once when the visitor does anything else first, or when there is no reveal to wait for.
let ready=!introMode;
document.documentElement.dataset.ready=String(ready);
function markReady(){if(ready)return;ready=true;document.documentElement.dataset.ready='true';}
function awaitReady(now){if(now||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)markReady();}
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
function settlePresentation(){quietBeforeAfterHint();settleReportHandoff($('#report-view'));settleReportHandoff($('#plain-report'));if(!introMode)markReady();}
// The page tells its story in one headline per step; every step stays reachable from the chapters.
const storyBeats=[
 ['This is what one prompt gets you.','One prompt, no ingredients: “Create a one-page website that helps its owner understand this week’s website performance.”'],
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
// The two throws that add an ingredient always land on the page, where what they change can be seen.
const DICE_THROW={first:{direction:1,strength:.5,page:true},second:{direction:-1,strength:.25,page:true},enter:[{direction:1,strength:.8},{direction:-1,strength:.8}],exit:[{direction:-1,strength:.55},{direction:1,strength:.55}]};
const LABEL_LAND={roll:250,enter:330};
// The second die comes in beside the page as the first one changes it.
const SECOND_DIE_WAIT=250;
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
function moveDice(entering,which=[0,1],wait=0){
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
   diceStageAnimations.push(object.animate([{transform:`translateX(${away}px)`},{transform:'translateX(0)'}],{duration:560,delay:(which.length>1?i*50:0)+wait,easing:'cubic-bezier(.2,.8,.25,1)',fill:'backwards'}));
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
// The sentence the dice add to the one-shot prompt, exactly as it was sent.
function ingredientLine(first,second){return `Combine ${first} and ${second} into a distinct visual identity.`;}
// What the visitor is looking at before any die is thrown.
const PROMPT_LEAD=['You asked AI for a report.','It looks like everyone else\u2019s.'];
function pointerSpec(){
 // Nothing floats beside the page: the tag on the die and the sentence above the page carry the walkthrough.
 // The demo still points at things with the same label.
 return pointer.custom||null;
}
// The die waiting to be thrown carries a floating tag: the first says how, the second only that it is next.
function updateDieCall(){
 const chip=$('#die-call'),index=view!=='dice'||comparing?-1:introMode?0:secondWaits?1:-1,stageBox=document.querySelector('.workbench');
 if(index<0||!stageBox?.getBoundingClientRect){chip.hidden=true;document.querySelectorAll('.die').forEach(die=>die.removeAttribute?.('data-waiting'));return;}
 const column=document.querySelectorAll('.die')[index],object=column?.querySelector('.die-object');
 if(!column?.getBoundingClientRect||!object){chip.hidden=true;return;}
 // The waiting die is lifted and put down now and then (CSS, with rests); the other stays still.
 document.querySelectorAll('.die').forEach((die,i)=>die.toggleAttribute?.('data-waiting',i===index));
 // On narrow screens the dice are small by the time the second one waits, and a tag would cover its name:
 // there the lift alone does the inviting.
 if(index===1&&matchMedia('(max-width: 860px)').matches){chip.hidden=true;return;}
 const moved=chip.dataset.for!==String(index);
 chip.textContent=index?'Now throw me':'Pick me up and throw me';chip.dataset.for=String(index);chip.hidden=false;
 const box=stageBox.getBoundingClientRect(),rect=column.getBoundingClientRect(),objectBox=object.getBoundingClientRect(),size=column.querySelector('.cube')?.offsetWidth||100,own=chip.getBoundingClientRect();
 // Above the die on wide screens. On narrow ones the first tag waits beside its die, in the half the second
 // die will take, and the second sits under its own die.
 const narrow=matchMedia('(max-width: 860px)').matches,side=!narrow?'above':index?'below':'right';chip.dataset.side=side;
 const middle=objectBox.top+objectBox.height/2;
 let x=side==='right'?rect.left+rect.width/2+size*.62+14-box.left:rect.left+rect.width/2-box.left-own.width/2;
 let y=side==='right'?middle-size*.12-box.top-own.height/2:side==='below'?middle+size*.74-box.top:middle-size*.95-box.top-own.height-14;
 // The whole tag stays on screen.
 x=Math.max(8-box.left,Math.min(x,innerWidth-box.left-own.width-8));y=Math.max(8-box.top,y);
 chip.style.left=Math.round(x)+'px';chip.style.top=Math.round(y)+'px';
 // The tag reaches the second die once that die has slid into place.
 if(moved&&index===1&&chip.animate&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)chip.animate([{opacity:0},{opacity:1}],{duration:260,delay:SECOND_DIE_WAIT+520,easing:'ease-out',fill:'backwards'});
}
// The label arrives in the order the eye should travel: a dot lands on the target, the leader draws out
// from it, then the card settles at the end of the line. It waits for the change it follows to finish.
let pointerAnimations=[];
function updatePointer(delay=0){
 updateDieCall();renderPromptLine();
 const note=$('#pointer-note'),spec=pointerSpec(),stageBox=document.querySelector('.workbench');
 if(!spec||!spec.target?.getBoundingClientRect||!stageBox?.getBoundingClientRect){pointerAnimations.forEach(animation=>animation.cancel());note.hidden=true;pointer.key='';return;}
 const key=spec.title+spec.sub+spec.side,changed=pointer.key!==key;
 if(changed){
  pointerAnimations.forEach(animation=>animation.cancel());pointerAnimations=[];$('#pointer-text').textContent=spec.title;$('#pointer-sub').textContent=spec.sub||'';note.dataset.side=spec.side;
  const action=$('#pointer-action'),card=document.querySelector('.pointer-card');action.hidden=!spec.action;action.textContent=spec.action?(spec.action.label+' →'):'';pointer.action=spec.action?.run||null;
  if(card)card.dataset.actionable=String(!!spec.action);
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
// Once the dice have a pair, one quiet line between the dice and the page says what they changed: the sentence
// added to the prompt, both ingredients in it, the die that just changed underlined. Tapping it opens the
// whole one-shot prompt with that line marked.
// What a push asks, in the prompt's own words: the opening sentence of the refinement prompt, exactly as sent.
function pushAsk(){return String(selected.steps[stage-1]?.prompt||'').split(/(?<=[.!?])\s+/)[0];}
const PUSH_TIMES=['','once','twice','three times'];
function promptLineState(){
 if(view!=='dice')return null;
 // On the plain page the sentence is already there, with its two gaps: each die fills one.
 if(introMode)return {pending:true};
 const pushes=passes?stage-1:0;
 return {a:INGREDIENTS_A[a],b:secondWaits?null:INGREDIENTS_B[b],changed:lastEvent?.kind==='swap'||lastEvent?.kind==='choose'?lastEvent.index:null,pushes,same:pushes>0&&selected.steps[stage-1].html===selected.steps[stage-2].html,ask:pushes>0?pushAsk():'',fresh:lastEvent?.kind==='pair'?0:lastEvent?.kind==='second'?1:null};
}
let promptLineKey='';
function renderPromptLine(){
 const row=$('#prompt-row'),line=$('#prompt-line'),state=promptLineState(),key=state?JSON.stringify(state):'';
 if(key===promptLineKey)return;
 promptLineKey=key;togglePromptLine(false);row.dataset.empty=String(!state);row.dataset.pending=String(!!state?.pending);row.dataset.half=String(!!state&&!state.pending&&state.b===null);
 if(!state){line.replaceChildren();return;}
 const part=(tag,content,className,flag)=>{const node=document.createElement(tag);node.textContent=content;if(className)node.className=className;if(flag)node.dataset[flag]='true';return node;};
 const gap=()=>{const node=part('span','','prompt-gap');node.setAttribute('aria-hidden','true');return node;};
 if(state.pending){
  // Each sentence of the lead stays whole, so a narrow screen breaks between them.
  const lead=part('span','','prompt-lead');lead.append(...PROMPT_LEAD.flatMap((sentence,n)=>n?[' ',part('span',sentence,'prompt-phrase')]:[part('span',sentence,'prompt-phrase')]));
  line.replaceChildren(lead,part('span','Add randomness: '),gap(),part('span',' and '),gap());
  line.setAttribute('aria-label',PROMPT_LEAD.join(' ')+' Add randomness: throw the die.');
  return;
 }
 // One die thrown: its ingredient is in, and the second gap stays open for the die still waiting.
 if(state.b===null){
  line.replaceChildren(part('span','The same report, with '),part('b',state.a,'',state.changed===0?'changed':state.fresh===0?'fill':''),part('span',' and '),gap());
  line.setAttribute('aria-label','The same report, with '+state.a+'. Throw the second die to add another ingredient.');
  return;
 }
 const parts=[part('span','The same report, with '),part('b',state.a,'',state.changed===0?'changed':state.fresh===0?'fill':''),part('span',' and '),part('b',state.b,'',state.changed===1?'changed':state.fresh!==null?'fill':''),part('span','.')];
 // After a push, a second line says what was asked: the same sentence each time, so only the count changes.
 if(state.pushes>0){
  const push=part('span','','prompt-push');
  push.append(part('span','Then asked, '+PUSH_TIMES[state.pushes]+': ','prompt-line-label'),part('span',state.ask.replace(/[.!?]$/,'')+'\u2026'));
  if(state.same)push.append(part('em',' This pass changed nothing.'));
  parts.push(push);
 }
 line.replaceChildren(...parts);
 line.setAttribute('aria-label','The same report, with '+state.a+' and '+state.b+'.'+(state.pushes>0?' Then asked, '+PUSH_TIMES[state.pushes]+': '+state.ask+(state.same?' This pass changed nothing.':''):'')+' Show the whole prompt.');
}
function togglePromptLine(open){
 const line=$('#prompt-line'),panel=$('#prompt-full'),show=open??panel.hidden;
 if(show&&$('#prompt-row').dataset.empty!=='true'&&$('#prompt-row').dataset.pending!=='true'&&$('#prompt-row').dataset.half!=='true'){
  const first=selected.steps[0];panel.replaceChildren();
  const body=document.createElement('span');body.className='pointer-prompt-text';showPrompt(body,first.prompt,ingredientLine(INGREDIENTS_A[a],INGREDIENTS_B[b]));panel.append(body);
  if(stage>1){const then=document.createElement('span');then.className='pointer-prompt-text';showPrompt(then,'\n\nThen, '+PUSH_TIMES[stage-1]+':\n'+selected.steps[stage-1].prompt);panel.append(then);}
  panel.hidden=false;line.setAttribute('aria-expanded','true');
 }else{panel.hidden=true;line.setAttribute('aria-expanded','false');}
}
$('#prompt-line').addEventListener('click',()=>togglePromptLine());
const pointerCard=document.querySelector('.pointer-card');
pointerCard?.addEventListener('click',()=>pointer.action?.());
document.addEventListener('pointerdown',event=>{if(!$('#prompt-full').hidden&&!event.target?.closest?.('#prompt-row'))togglePromptLine(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#prompt-full').hidden){togglePromptLine(false);$('#prompt-line').focus?.();}});
function showPointer(target,title,sub='',side='above'){pointer.custom={target,title,sub,side};updatePointer();}
function clearPointer(){pointer.custom=null;updatePointer();}
window.addEventListener('resize',()=>updatePointer());
// An ingredient's name carries a face slug, so it can be set in the type that ingredient brings.
function setDieCall(index){const label=$('#ingredient-'+(index?'b':'a'));label.textContent='';label.dataset.face='call';}
function setIngredientLabel(index,name){const label=$('#ingredient-'+(index?'b':'a'));label.textContent=name;label.dataset.face=name.toLowerCase().replace(/[^a-z]+/g,'-');}
function showBrief(){if(introMode)return;settlePresentation();promoteRefine(false);cancelDiceRoll();introMode=true;secondWaits=false;lastEvent={kind:'reset'};stage=1;comparing=false;render();}
// A visitor's first roll of the visit is celebrated once; the demo's authored rolls never count.
let firstRollCelebrated=false;
// The first roll of a visit is guided in: it lands on one of a few curated showcase pairs, where the one added
// sentence most clearly makes a distinct, readable page. Every roll after that is random. The results
// themselves are untouched; only the first draw is chosen.
let SHOWCASE=(typeof CURATION!=='undefined'&&Array.isArray(CURATION.showcase)?CURATION.showcase:[]).map(entry=>String(entry.pair??entry)).filter(id=>/^\d+-\d+$/.test(id));
let guidedIn=false;
function introPair(){
 if(!guidedIn&&SHOWCASE.length)return SHOWCASE[randomIndex(SHOWCASE.length)].split('-').map(Number);
 return [randomIndex(INGREDIENTS_A.length),randomIndex(INGREDIENTS_B.length)];
}
function celebrateFirstRoll(impact,forced){if(forced!=null||firstRollCelebrated)return;firstRollCelebrated=true;impact.celebrate=true;}
function showIngredients(){
 if(!ingredientsChosen){roll();return;}
 settlePresentation();introMode=false;stage=1;markReady();render();
}
// Which edge of the page a control sits beyond: a change it causes starts from that edge.
function pageSideOf(control){
 const page=$('#report-view').getBoundingClientRect?.(),box=control?.getBoundingClientRect?.();
 if(!page?.width||!box?.width)return 'top';
 const x=box.left+box.width/2,y=box.top+box.height/2;
 return y>=page.bottom?'bottom':y<=page.top?'top':x<page.left+page.width/2?'left':'right';
}
// A change made from a control (a step on the rail, Reset) reprints the page from that control's side.
function changeFrom(control,run){
 const impact=reportImpactFor(run);aimReportImpact(impact,[pageSideOf(control)]);landReportImpact(impact);
}
// Right after a roll the dice and the new page have the stage. The action waits, quiet but usable, and steps
// forward once everything has come to rest: no die moving, no page changing, no before/after hint playing.
const REFINE_CALM=1000;
let refineCalm=null;
function quietRefine(){
 const button=$('#experiment-next');
 if(typeof requestAnimationFrame!=='function'||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){promoteRefine(false);return;}
 button.dataset.quiet='true';
 if(refineCalm)cancelAnimationFrame(refineCalm);
 let still=null;
 const check=now=>{
  const busy=(typeof dieStates!=='undefined'&&dieStates.some(state=>state.running))||(typeof reportHandoffs!=='undefined'&&reportHandoffs.has($('#report-view')))||beforeAfter.hinting||!!beforeAfter.drag;
  still=busy?null:still??now;
  if(still!==null&&now-still>REFINE_CALM){refineCalm=null;promoteRefine();return;}
  refineCalm=requestAnimationFrame(check);
 };
 refineCalm=requestAnimationFrame(check);
}
function promoteRefine(sheen=true){
 if(refineCalm&&typeof cancelAnimationFrame==="function"){cancelAnimationFrame(refineCalm);refineCalm=null;}
 const button=$('#experiment-next');if(button.dataset.quiet!=='true')return;
 delete button.dataset.quiet;if(sheen&&!introMode)sheenNextButton();
}
function sheenNextButton(){const button=$('#experiment-next');button.classList.toggle('is-firing',false);void button.offsetWidth;button.classList.toggle('is-firing',true);}
// Rolling from the button: it sinks, springs up past its rest and settles; the dice do the rest.
function fireNextButton(){
 const button=$('#experiment-next');sheenNextButton();
 if(!button.animate||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 button.animate([{translate:'0 3px'},{translate:'0 -7px',offset:.3},{translate:'0 1.5px',offset:.6},{translate:'0 -.5px',offset:.82},{translate:'0 0'}],{duration:520,easing:'cubic-bezier(.33,1,.68,1)'});
}
// Refining from the button: it sinks, then reaches across the gap and touches the page's nearest edge.
// The touch is the moment the refinement lands: the page gives, and the new pass prints from that edge.
function pressRefine(impact){
 const button=$('#experiment-next'),page=$('#report-view'),side=pageSideOf(button);
 sheenNextButton();aimReportImpact(impact,[side]);
 const land=(touch,x)=>{hitReport(impact,{side,knock:touch,x,y:0,strength:.5,die:1});if(typeof playRefineStamp==='function')playRefineStamp();};
 if(!button.animate||!page.getBoundingClientRect||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){land(false,0);return;}
 const box=button.getBoundingClientRect(),rect=page.getBoundingClientRect(),toward=side==='bottom'?-1:1;
 const gap=side==='bottom'?box.top-rect.bottom:rect.top-box.bottom,touch=gap>=0&&gap<=64,travel=touch?gap:8;
 const x=Math.max(16,Math.min(rect.width-16,box.left+box.width/2-rect.left));
 const reach=button.animate([{translate:'0 0'},{translate:`0 ${-toward*3}px`,offset:.35},{translate:`0 ${toward*travel}px`}],{duration:200,easing:'cubic-bezier(.55,0,.8,.2)',fill:'forwards'});
 reach.onfinish=()=>{
  land(touch,x);
  button.animate([{translate:`0 ${toward*travel}px`},{translate:`0 ${-toward*Math.min(9,travel*.35)}px`,offset:.42},{translate:`0 ${toward*1.5}px`,offset:.72},{translate:'0 0'}],{duration:480,easing:'cubic-bezier(.33,1,.68,1)'});
  reach.cancel();
 };
}
function nextExperimentStep(){
 promptPeeks.forEach(peek=>peek.close());
 if(introMode){fireNextButton();roll();}
 else if(stage<4&&!pairKept()){const impact=reportImpactFor(()=>setAttempt(stage+1));pressRefine(impact);}
 else{fireNextButton();stage=1;comparing=false;roll();}
}
function updateURL(){
 const query=new URLSearchParams({view,pair:selected.id,stage:String(stage),plainStage:String(plainStage)});
 if(method==='newer')query.set('model','newer');else query.set('prompt',method);
 if(comparing)query.set('compare','1');
 if(comparison==='other')query.set('against','other');
 if(passes)query.set('passes','1');
 // A link made between the two throws opens on the plain page: half a pair is not a saved result.
 if(introMode||secondWaits)query.set('start','original');
 try{history.replaceState(null,'',location.pathname+'?'+query);}catch{}
}
// Saved reports scroll inside sandboxed frames. A small bridge, appended after the saved
// document, shares the reading position so a new step or a comparison opens at the same place.
// A requested position is re-applied while the report's own layout settles, until the reader scrolls.
const REPORT_SCROLL_BRIDGE='<script data-report-scroll>(()=>{let quietUntil=0,queued=false,target=null;const room=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);const apply=()=>{if(target===null)return;quietUntil=performance.now()+150;scrollTo({top:Math.round(target*room()),behavior:"instant"});};addEventListener("message",e=>{if(e.source!==parent||e.data?.type!=="report-scroll-to")return;target=e.data.ratio;apply();});addEventListener("scroll",()=>{if(performance.now()<quietUntil)return;target=null;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const r=room();parent.postMessage({type:"report-scroll",ratio:r?scrollY/r:0},"*");});},{passive:true});let told=0;const tell=()=>{const h=Math.ceil(document.documentElement.scrollHeight);if(Math.abs(h-told)>2){told=h;parent.postMessage({type:"report-height",height:h},"*");}};const settle=new ResizeObserver(()=>{apply();tell();});settle.observe(document.documentElement);if(document.body)settle.observe(document.body);addEventListener("load",()=>{tell();parent.postMessage({type:"report-ready"},"*");},{once:true});})();<\/script>';
const reportScroll=new Map();
function visibleReportFrames(container){const cache=previewCaches.get(container);return cache?[...cache.values()].filter(section=>!section.hidden).map(section=>section.querySelector('iframe')):[];}
function scrollReport(frame,ratio){frame.contentWindow?.postMessage?.({type:'report-scroll-to',ratio},'*');}
// A report is shown whole: its frame takes the report's own height, so the page scrolls through the full
// composition instead of a box inside it. A frame whose width changes measures again from its default.
function fitReportFrame(frame,height){
 if(!(height>200))return;
 frame.style.height=Math.min(9000,Math.round(height))+'px';frame.dataset.fitWidth=String(frame.clientWidth||0);
}
const reportFrameWidths=typeof ResizeObserver==='function'?new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>{
 const width=Math.round(contentRect.width);if(!width||!target.dataset.fitWidth||Math.abs(width-Number(target.dataset.fitWidth))<2)return;
 target.style.height='';delete target.dataset.fitWidth;
})):null;
window.addEventListener('message',event=>{
 if(event.data?.type==='report-height'){
  for(const container of [$('#report-view'),$('#plain-report')]){
   const cache=previewCaches.get(container);if(!cache)continue;
   for(const section of cache.values()){const frame=section.querySelector('iframe');if(frame?.contentWindow===event.source){fitReportFrame(frame,Number(event.data.height));return;}}
  }
  return;
 }
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
 section.append(frame);container.append(section);reportFrameWidths?.observe(frame);
 return section;
}
// Every report is a whole document. Only a few stay loaded: the ones on screen, the original the slider
// compares with, and the most recent others; older ones are let go and load again if they come back.
const REPORT_CACHE_LIMIT=6;
function trimReportCache(container,cache){
 const original=typeof beforeAfter==='object'?beforeAfter.item?.file:null;
 for(const [file,section] of [...cache]){
  if(cache.size<=REPORT_CACHE_LIMIT)return;
  if(!section.hidden||file===original||section.classList?.contains?.('report-outgoing')||section.classList?.contains?.('report-before'))continue;
  section.remove?.();cache.delete(file);
 }
}
function showReports(container,entries){
 const heldCover=takeReportCover(container);
 let cache=previewCaches.get(container);if(!cache){cache=new Map();previewCaches.set(container,cache);}
 const previous=heldCover?[heldCover]:[...cache.values()].filter(section=>!section.hidden);
 for(const section of cache.values())section.hidden=true;
 entries.forEach(({item,label},order)=>{
  let section=cache.get(item.file);
  if(!section)section=addReport(container,item,label||'Report');
  cache.delete(item.file);cache.set(item.file,section);
  // Pages loaded ahead of time, or for the slider, carry no heading until one is needed.
  let heading=section.querySelector('h3');if(!heading&&label){heading=document.createElement('h3');section.prepend(heading);}
  if(heading){heading.textContent=label||'';heading.hidden=!label;if(label){const badge=document.createElement('span');badge.className='same-data';badge.textContent='Same data';heading.append(badge);}}
  section.querySelector('iframe').title=label||(/^(stronger-|newer-)?plain-/.test(item.file)?'Plain weekly report':selected.label);
  section.style.order=String(order);section.hidden=false;
  const frame=section.querySelector('iframe');if(frame.dataset.loaded==='true')scrollReport(frame,reportScroll.get(container)||0);
  if(entries.length===1&&!label&&previous.length===1&&previous[0]!==section){
   handoffReport(container,previous[0],section);
   // The new page settles into place as the old one is wiped away: a small drop, not a slide.
   if(section.animate&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)section.animate([{transform:'translateY(-12px) scale(.985)'},{transform:'none'}],{duration:560,easing:'cubic-bezier(.23,1,.32,1)'});
  }
 });
 trimReportCache(container,cache);
}
// Before and after: the original report, with no ingredients, sits under the current page. The knob in the
// middle of the page wipes it back in from the left as far as it is dragged, and a "Before" tag shows only
// on what it reveals. The position holds across rolls and refinements: only the after side changes.
const beforeAfter={value:0,item:null,section:null,tween:null,hinted:false,hinting:false,drag:null};
function beforeItem(){
 if(view!=='dice'||introMode||comparing)return null;
 return plainItem();
}
function paintBeforeAfter(value){
 const box=$('#before-after'),handle=$('#ba-handle'),container=$('#report-view');
 beforeAfter.value=Math.max(0,Math.min(1,value));
 box.style.setProperty('--ba',beforeAfter.value.toFixed(4));
 box.toggleAttribute?.('data-active',beforeAfter.value>0);
 const percent=Math.round(beforeAfter.value*100);
 handle.setAttribute('aria-valuenow',String(percent));
 handle.setAttribute('aria-valuetext',percent?percent+'% of the original shown':'Current page');
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
// The hint is never the visitor's position. A change cancels it on the spot and puts the slider back, so
// nothing on the page slides while the page itself is changing. A hint that had begun to move has been
// seen; one still waiting tries again once the next page has landed.
function quietBeforeAfterHint(){
 if(!beforeAfter.hinting)return;
 beforeAfter.hinting=false;if(beforeAfter.value>0)beforeAfter.hinted=true;
 stopBeforeAfterTween();paintBeforeAfter(0);
 $('#before-after').querySelector?.('.ba-knob')?.getAnimations?.().forEach(animation=>animation.cancel());
}
// Taking hold of the slider keeps it where the hint had it and ends the hints for good.
function takeBeforeAfter(){beforeAfter.hinting=false;beforeAfter.hinted=true;stopBeforeAfterTween();markReady();}
// Glide to a value; shape(t) maps progress to position for the hints.
function tweenBeforeAfter(to,duration=360,shape=null,delay=0){
 stopBeforeAfterTween();
 if(typeof requestAnimationFrame!=='function'||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden){shape?.(1);paintBeforeAfter(shape?beforeAfter.value:to);return;}
 const from=beforeAfter.value,start=performance.now()+delay,ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
 const step=now=>{const t=Math.max(0,Math.min(1,(now-start)/duration));if(now>=start)paintBeforeAfter(shape?shape(t):from+(to-from)*ease(t));beforeAfter.tween=t<1?requestAnimationFrame(step):null;};
 beforeAfter.tween=requestAnimationFrame(step);
}
// Called around each render: the before page is released first, so the render sees only the current
// page, then shown again at the same position. The original stays the same, so the position holds.
function renderBeforeAfter(){
 const item=beforeItem(),box=$('#before-after');
 if(item!==beforeAfter.item){stopBeforeAfterTween();beforeAfter.item=item;}
 // A fresh start puts the slider away; side-by-side comparison only hides it, keeping its place.
 if(introMode)paintBeforeAfter(0);else if(item)paintBeforeAfter(beforeAfter.value);else releaseBeforeSection();
 box.hidden=!item;
}
// The first time a roll's page lands it is left alone to be looked at. Then the original is wiped in from the
// left and away again, once: the same figures in two designs teach the mechanism without a word, and the
// handle is left at the edge to be pulled. Nothing else arrives until that is over; then the controls do.
const FIRST_HOLD=2500,FIRST_PEEK=1700;
function reportHandoffSettled(container){
 if(container===$('#report-view'))warmReports();
 if(container!==$('#report-view')||!beforeAfter.item||beforeAfter.value||beforeAfter.drag||beforeAfter.hinted||beforeAfter.hinting)return;
 beforeAfter.hinting=true;
 const ease=x=>x<.5?4*x*x*x:1-(-2*x+2)**3/2;
 tweenBeforeAfter(0,FIRST_PEEK,t=>{
  if(t>=1){beforeAfter.hinting=false;beforeAfter.hinted=true;markReady();return 0;}
  return .56*(ease(Math.min(1,t/.36))-ease(Math.max(0,(t-.6)/.4)));
 },FIRST_HOLD);
}
(()=>{
 const handle=$('#ba-handle'),box=$('#before-after');
 // The knob and the line both grab the same divider.
 const grips=[handle,box.querySelector?.('.ba-line')].filter(Boolean);
 const valueAt=x=>{const rect=$('#report-view').getBoundingClientRect?.();return rect?.width?(x-rect.left)/rect.width:beforeAfter.value;};
 const end=event=>{
  const drag=beforeAfter.drag;if(!drag||event.pointerId!==drag.id)return;
  beforeAfter.drag=null;box.toggleAttribute?.('data-dragging',false);
  // A tap without a drag opens the comparison halfway, or closes it.
  if(!drag.moved)tweenBeforeAfter(drag.from>0?0:.5);
 };
 grips.forEach(grip=>{
  grip.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;
   takeBeforeAfter();settlePresentation();
   beforeAfter.drag={id:event.pointerId,x:event.clientX,moved:false,from:beforeAfter.value};
   grip.setPointerCapture?.(event.pointerId);box.toggleAttribute?.('data-dragging',true);
  });
  grip.addEventListener('pointermove',event=>{
   const drag=beforeAfter.drag;if(!drag||event.pointerId!==drag.id)return;
   if(!drag.moved&&Math.abs(event.clientX-drag.x)<4)return;
   drag.moved=true;event.preventDefault?.();paintBeforeAfter(valueAt(event.clientX));
  });
  grip.addEventListener('pointerup',end);grip.addEventListener('pointercancel',end);
 });
 handle.addEventListener('keydown',event=>{
  const steps={ArrowRight:.05,ArrowUp:.05,ArrowLeft:-.05,ArrowDown:-.05,PageUp:.25,PageDown:-.25};
  let next=null;
  if(event.key in steps)next=beforeAfter.value+steps[event.key];
  else if(event.key==='Home'||event.key==='Escape')next=0;else if(event.key==='End')next=1;
  else if(event.key==='Enter'||event.key===' ')next=beforeAfter.value>0?0:.5;
  if(next===null)return;
  event.preventDefault();takeBeforeAfter();settlePresentation();
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
 const kept=pairKept(),refining=!introMode&&stage<4&&!kept;
 // Each pass pushes the same pair further: more distinct, not necessarily better, so the button says push.
 const label=introMode?'Add randomness':kept?'Roll a new pair':stage===1?'Critique and redo':stage<4?'Again':'Roll a new pair';
 // After the last pass the question has the stage: the action waits, quiet, until a version is kept.
 $('#experiment-next').dataset.wait=String(!introMode&&stage===4&&!kept);
 $('#experiment-next').dataset.passes=String(introMode?0:stage-1);
 const cue=refining?'+'+stage:'→';
 $('#experiment-next').dataset.action=refining?'refine':'roll';
 $('#experiment-next').setAttribute('aria-label',refining?label+'. Refinement '+stage:label);
 updateActionText($('#next-label'),label,animate);updateActionText($('#next-cue'),cue,animate);
 showStory();syncRailMarker(animate);paintedStep=value;
}
function renderResult(){
 quietBeforeAfterHint();stopBeforeAfterTween();releaseBeforeSection();
 const container=$('#report-view');container.classList.toggle('comparing',comparing);
 const current=introMode?plainItem():selected.steps[stage-1];
 // "Other" is each track's one alternative: the earlier model's two prompts compare with each
 // other from a shared one-shot; the newer model compares with the earlier original-prompt run.
 const other=(method==='original'?STRONGER_EXPERIMENT:EXPERIMENT).runs.find(run=>run.id===selected.id).steps[stage-1];
 const currentLabel=method==='newer'?'Newer model':method==='stronger'?'Stronger prompt':'Original prompt';
 const otherLabel=method==='newer'?'Earlier model':method==='stronger'?'Original prompt':'Stronger prompt';
 let entries=[{item:current,label:''}];
 const pairName=INGREDIENTS_A[a]+' × '+INGREDIENTS_B[b];
 if(comparing&&comparison==='plain')entries=[{item:plainItem(),label:'No dice'},{item:current,label:secondWaits?INGREDIENTS_A[a]:passes&&stage>1?pairName+' \u00b7 +'+(stage-1):pairName}];
 if(comparing&&comparison==='other')entries=stage===1&&method!=='newer'?[{item:current,label:'Shared one-shot'}]:method==='original'?[{item:current,label:currentLabel},{item:other,label:otherLabel}]:[{item:other,label:otherLabel},{item:current,label:currentLabel}];
 if(introMode)entries=[{item:current,label:''}];
 container.classList.toggle('comparing',entries.length>1);document.documentElement.dataset.comparing=String(entries.length>1);
 container.dataset.passes=String(!introMode&&entries.length===1?stage-1:0);
 showReports(container,entries);
 renderBeforeAfter();
 $('#pair-title').textContent=introMode?'No ingredients':secondWaits?INGREDIENTS_A[a]:selected.label;
 $('#compare').disabled=introMode;
 $('#compare').setAttribute('aria-pressed',String(comparing));
 $('#compare').setAttribute('aria-label',comparing&&comparison==='other'?(method==='newer'?'Compare model generations':'Compare refinement prompts'):'Compare with no ingredients');
 $('#compare-target').hidden=introMode||!comparing;$('#compare-target').value=comparison;$('#compare-other').textContent=otherLabel;
 $('#view-plain').disabled=false;$('#view-plain').textContent='Refine brief alone →';
 $('#method-original').setAttribute('aria-pressed',String(method==='original'));$('#method-stronger').setAttribute('aria-pressed',String(method==='stronger'));$('#method-newer').setAttribute('aria-pressed',String(method==='newer'));
 $('#model-toggle').setAttribute('aria-pressed',String(method==='newer'));$('#passes-toggle')?.setAttribute('aria-pressed',String(passes));
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
 a=selected.a;b=selected.b;if(!passes)stage=SHOWN;stage=Math.min(stage,selected.steps.length);
 const journey=introMode?'original':'ingredients',previousJourney=document.documentElement.dataset.journey;
 document.documentElement.dataset.journey=journey;$('#reset').hidden=journey==='original';
 // In the plain step the dice are away; they keep their last names so an exit never shows placeholder labels.
 // A die that is waiting to be rolled says so; a rolled die shows its ingredient in that ingredient's type.
 if(!introMode)setIngredientLabel(0,INGREDIENTS_A[a]);else setDieCall(0);
 if(!introMode&&!secondWaits)setIngredientLabel(1,INGREDIENTS_B[b]);else setDieCall(1);
 matrixButtons.forEach((button,id)=>{button.setAttribute('aria-pressed',String(!introMode&&id===selected.id));const run=currentExperiment().runs.find(item=>item.id===id);button.setAttribute('aria-label',run.label+' — '+attemptName(stage));});
 matrixCells.forEach((cell,id)=>{
  cell.hidden=Number(id.split('-')[0])!==a;if(cell.hidden)return;
  const item=currentExperiment().runs.find(run=>run.id===id).steps[stage-1],frame=cell.querySelector('iframe');
  if(frame.dataset.file!==item.file){frame.srcdoc=item.html;frame.dataset.file=item.file;}
 });
 $('#atlas-ingredient').value=String(a);
 renderResult();renderKeep();if(sync)syncDice3D();updateURL();
 const entering=previousJourney!==journey&&journey!=='original'&&view==='dice';
 // Beat order: the press, then the page or dice, then the timeline, then the next label.
 updatePointer(entering?900:paintedStep===null?500:760);
 // The second die waits off the table until the first has been thrown. It slides in beside the page then, at
 // rest, for the visitor to throw, and rolls away again on a fresh start.
 const second=!introMode,hadSecond=document.documentElement.dataset.second;
 document.documentElement.dataset.second=String(second);
 if(hadSecond!==undefined&&hadSecond!==String(second)&&view==='dice')moveDice(second,[1],second?SECOND_DIE_WAIT:0);
 $('#status').textContent=introMode?'The report with no ingredients. Throw the die to add one.':secondWaits?INGREDIENTS_A[a]+' added. Throw the second die to add another.':selected.label+'. '+attemptName(stage)+'.';
}
function selectPair(run){settlePresentation();introMode=false;secondWaits=false;lastEvent={kind:'pick'};ingredientsChosen=true;cancelDiceRoll();selected=currentExperiment().runs.find(item=>item.id===run.id);render();}
function chooseDieFace(index,value){
 settlePresentation();pointer.dieHintUsed=true;
 const introducing=introMode,filling=!introMode&&index===1&&secondWaits;introMode=false;ingredientsChosen=true;
 if(introducing){stage=1;comparing=false;secondWaits=true;}else if(index===1)secondWaits=false;
 const values=[selected.a,selected.b];values[index]=value;
 lastEvent=introducing?{kind:'pair'}:filling?{kind:'second'}:{kind:'choose',index,name:index?INGREDIENTS_B[value]:INGREDIENTS_A[value]};
 // A deliberate choice keeps the other face, even on the first interaction.
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 render(false);settleDieGrab(index,true);syncDice3D();awaitReady(!introducing);
}
// Whether a face is the ingredient this die already has: letting go of a die with that face up chose nothing.
function dieShowsFace(index,value){return value===(index?selected.b:selected.a);}
// A carried die let go of: the face it shows on top is the choice, and the page changes when the dropped
// die reaches it.
function dropDie(index,value,release={}){
 settlePresentation();pointer.dieHintUsed=true;if(comparing&&!introMode)comparing=false;
 const introducing=introMode,filling=!introMode&&index===1&&secondWaits;introMode=false;ingredientsChosen=true;
 if(introducing){stage=1;comparing=false;secondWaits=true;}else if(index===1)secondWaits=false;
 const values=[selected.a,selected.b];values[index]=value;
 lastEvent=introducing?{kind:'pair'}:filling?{kind:'second'}:{kind:'choose',index,name:index?INGREDIENTS_B[value]:INGREDIENTS_A[value]};
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 const impact=reportImpactFor(()=>render(false));celebrateFirstRoll(impact,null);
 tumbleDice([index],values,()=>{syncDice3D();},{...release,drop:true,guided:true},impact);
 // The second die is not thrown on the first roll: it arrives at rest, unnamed.
 if(introducing)syncDice3D();
 landLabels([index],LABEL_LAND.roll);
 awaitReady(!introducing);
 quietRefine();
}
// The gallery stays folded until it is wanted; opening it settles in from just above.
$('#atlas-toggle').addEventListener('click',()=>{
 const toggle=$('#atlas-toggle'),body=$('#atlas-body'),open=toggle.getAttribute('aria-expanded')!=='true';
 toggle.setAttribute('aria-expanded',String(open));body.hidden=!open;
 if(open&&body.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)body.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.23,1,.32,1)'});
});
$('#atlas-ingredient').addEventListener('change',event=>selectPair(currentExperiment().runs.find(run=>run.a===Number(event.target.value)&&run.b===b)));
// Loading a report is most of what a page change costs. While the page is idle, the pages a visitor is
// likely to see next are loaded out of sight: this pair's next refinement, and the pair each die will roll
// to (drawn now, used by the next roll), so changing to any of them is instant.
const upcoming={faces:[null,null],intro:null};
function warmReports(){
 if(typeof requestIdleCallback!=='function'||view!=='dice'||comparing)return;
 requestIdleCallback(()=>{
  const container=$('#report-view'),cache=previewCaches.get(container);
  if(!cache||view!=='dice'||comparing)return;
  const runs=currentExperiment().runs,find=(a,b)=>runs.find(run=>run.a===a&&run.b===b),items=[];
  if(introMode){
   upcoming.intro??=introPair();
   items.push(find(...upcoming.intro)?.steps[(passes?1:SHOWN)-1]);
  }else{
   if(stage<4)items.push(selected.steps[stage]);
   [0,1].forEach(i=>{
    const current=i?selected.b:selected.a;
    if(upcoming.faces[i]===null||upcoming.faces[i]===current)upcoming.faces[i]=nextIngredient(i,current);
    const values=[selected.a,selected.b];values[i]=upcoming.faces[i];items.push(find(...values)?.steps[stage-1]);
   });
  }
  for(const item of items){if(!item||cache.has(item.file))continue;const section=addReport(container,item,'');section.hidden=true;cache.set(item.file,section);}
 },{timeout:1500});
}
// The face a roll lands on: the one already drawn and loaded if it still applies, otherwise a fresh draw.
function takeUpcoming(index,current){
 const face=upcoming.faces[index];upcoming.faces[index]=null;
 return face!==null&&face!==current?face:nextIngredient(index,current);
}
// After the third push the flow ends on a choice, not an essay: every version of this pair laid out under
// the page, from the plain one-shot to the third push. Choosing one shows it and marks it kept.
const keep={pair:null,pick:null,built:''};
// A version has been kept for the pair on screen: the pass is over, and the action offers the next pair.
function pairKept(){return passes&&view==='dice'&&!introMode&&keep.pair===selected.id&&keep.pick!==null;}
// The saved editorial pick for this pair on this track (1 = Dice … 4 = +3), with its reason.
function editorPick(){const entry=(typeof CURATION!=='undefined'?CURATION.picks?.[method]:null)?.[selected.id];return entry&&Number.isInteger(entry.pick)?entry:null;}
const KEEP_LABELS=['No dice','Dice','+1','+2','+3'];
function keepVersions(){return [{stage:0,label:'No dice',item:currentBaseline().steps[0]},...selected.steps.map((item,index)=>({stage:index+1,label:['Dice','+1','+2','+3'][index],item}))];}
function renderKeep(){
 const panel=$('#keep'),list=$('#keep-versions');
 if(view==='dice'&&!introMode&&stage===4&&keep.pair!==selected.id){keep.pair=selected.id;keep.pick=null;}
 const show=passes&&view==='dice'&&!introMode&&keep.pair===selected.id;
 panel.hidden=!show;panel.dataset.picked=String(show&&keep.pick!==null);if(!show)return;
 const key=selected.id+'|'+method;
 if(keep.built!==key){
  keep.built=key;list.replaceChildren();
  for(const version of keepVersions()){
   const button=document.createElement('button'),thumb=document.createElement('span'),frame=document.createElement('iframe'),name=document.createElement('span');
   button.type='button';button.className='keep-version';button.dataset.stage=String(version.stage);
   thumb.className='keep-thumb';frame.title=version.label;frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.loading='lazy';frame.srcdoc=version.item.html;
   name.className='keep-name';name.textContent=version.label;
   thumb.append(frame);button.append(thumb,name);list.append(button);thumbnailObserver.observe?.(thumb);
   button.addEventListener('click',()=>chooseKept(version.stage));
  }
 }
 const showing=beforeAfter.value>=.99?0:stage,picked=keep.pick!==null,ours=editorPick(),yours=KEEP_LABELS[keep.pick];
 // The question is answered once it has been: what they kept, beside the pick saved for this pair and why.
 $('#keep-title').textContent=!picked?'Which would you keep?':!ours?`You kept ${yours}.`:ours.pick===keep.pick?`You kept ${yours}. So did we: ${ours.reason}.`:`You kept ${yours}. Our pick is ${KEEP_LABELS[ours.pick]}: ${ours.reason}.`;
 for(const button of list.children){const at=Number(button.dataset.stage),theirs=picked&&!!ours&&ours.pick===at&&at!==keep.pick;button.setAttribute('aria-pressed',String(keep.pick===at));button.dataset.showing=String(at===showing);button.dataset.ours=String(theirs);button.setAttribute('aria-label',(button.textContent||'')+(keep.pick===at?', kept':'')+(theirs?', our pick':''));}
}
function chooseKept(value){
 keep.pick=value;
 if(value===0){if(comparing){comparing=false;renderResult();}tweenBeforeAfter(1);}
 else{if(beforeAfter.value>=.99)paintBeforeAfter(0);setAttempt(value);}
 renderKeep();renderRail();updateURL();
}
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
 // On the plain page there is one die. Throwing it adds the first ingredient and the page changes at once; the
 // second die comes in beside the page, unnamed, and waits there to be thrown for the second.
 if(introMode&&index===1)return;
 settlePresentation();
 // A die thrown at a side-by-side comparison returns to the single page, so it can strike the page again.
 if(comparing&&!introMode&&(index===0||index===1))comparing=false;
 const introduce=introMode;introMode=false;ingredientsChosen=true;
 if(introduce){stage=1;comparing=false;}
 if(index===0||index===1)pointer.dieHintUsed=true;
 const before=selected,indices=introduce?[0]:index===0||index===1?[index]:[0,1],values=[before.a,before.b];
 const announce=!introduce&&(index===0||index===1),filling=!introduce&&index===1&&secondWaits;
 // The demo passes authored faces; every visitor roll stays random.
 if(introduce){const drawn=upcoming.intro??introPair();upcoming.intro=null;if(!forced)guidedIn=true;values[0]=forced?.[0]??drawn[0];values[1]=forced?.[1]??drawn[1];secondWaits=true;}
 else{indices.forEach(i=>{values[i]=forced?.[i]??takeUpcoming(i,values[i]);});if(indices.includes(1))secondWaits=false;}
 selected=currentExperiment().runs.find(run=>run.a===values[0]&&run.b===values[1]);
 if(filling)lastEvent={kind:'second'};
 else if(announce){const i=indices[0];lastEvent={kind:'swap',index:i,name:i?INGREDIENTS_B[values[1]]:INGREDIENTS_A[values[0]]};}
 else lastEvent={kind:'pair'};
 // Selection is immediate; only the old page's cover waits for the die to reach the page.
 const impact=reportImpactFor(()=>render(false));celebrateFirstRoll(impact,forced);
 tumbleDice(indices,values,()=>{syncDice3D();},introduce?[gesture||DICE_THROW.first,null]:filling&&!gesture?DICE_THROW.second:gesture,impact);
 // The second die is not thrown on the first roll: it arrives at rest, unnamed.
 if(introduce)syncDice3D();
 landLabels(indices,LABEL_LAND.roll);
 // The first result is left alone to be looked at; anything a visitor does after it brings the controls at once.
 awaitReady(!introduce||forced!=null);
 quietRefine();
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
// About the experiment can bring the passes back: the action, the step track and the keep question.
$('#passes-toggle')?.addEventListener('click',()=>{settlePresentation();passes=!passes;document.documentElement.dataset.passes=String(passes);if(!introMode)markReady();render();});
$('#plain-method').addEventListener('change',event=>changeMethod(event.target.value==='newer'?'newer':event.target.value==='original'?'original':'stronger'));
function setAttempt(value){if(introMode)return;settlePresentation();promoteRefine(false);lastEvent=null;const next=Math.round(Number(value));if(selected.steps[next-1]){stage=next;render(false);}}
$('#stage-0').addEventListener('click',()=>changeFrom($('#stage-0'),showBrief));
for(let value=1;value<=4;value++)$('#stage-'+value).addEventListener('click',()=>{
 if(introMode){if(value===1)showIngredients();}
 else changeFrom($('#stage-'+value),()=>setAttempt(value));
});
$('#experiment-next').addEventListener('click',nextExperimentStep);
$('#experiment-next').addEventListener('animationend',()=>$('#experiment-next').classList.toggle('is-firing',false));
$('#reset').addEventListener('click',()=>{changeFrom($('#reset'),showBrief);$('#experiment-next').focus({preventScroll:true});});
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
initDice3D();if(typeof initDiceSound==='function')initDiceSound();buildMatrix();render();selectView(view);warmReports();
