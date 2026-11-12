// Authored demo: a cursor runs the story once on the real controls. Every state it reaches is the
// real page state, so any visitor input takes over at once from exactly what is on screen.
const demo={running:false,token:0,timer:null,resolve:null,remaining:0,started:0,move:null,x:0,y:0,hovered:null};
const demoCursor=$('#demo-cursor');
const demoReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
// On narrow screens the dice sit above the page, so the cursor rests below them instead of beside.
const demoNarrow=()=>matchMedia('(max-width: 860px)').matches;
function demoWait(ms){return new Promise(resolve=>{demo.resolve=resolve;demo.remaining=ms;if(!document.hidden)demoTick();});}
function demoTick(){
 if(!demo.resolve||demo.timer)return;
 demo.started=performance.now();
 demo.timer=setTimeout(()=>{const resolve=demo.resolve;demo.resolve=null;demo.timer=null;resolve();},demo.remaining);
}
function demoHold(){
 if(demo.timer){clearTimeout(demo.timer);demo.timer=null;demo.remaining=Math.max(0,demo.remaining-(performance.now()-demo.started));}
 demo.move?.pause();
}
function demoContinue(){demo.move?.play();demoTick();}
function placeCursor(){demoCursor.style.transform=`translate(${demo.x}px,${demo.y}px)`;}
function demoHover(target){
 demo.hovered?.classList.remove('is-demo-hover');if(demo.hovered?.classList.contains('die-object'))delete demo.hovered.dataset.hover;
 demo.hovered=target;if(!target)return;
 target.classList.add('is-demo-hover');if(target.classList.contains('die-object'))target.dataset.hover='true';
}
// Where the cursor aims: inside the target, off its words.
const DEMO_AIM={action:[.9,.55],die:[.5,.42]};
async function demoMoveToPoint(x,y){
 const from=[demo.x,demo.y],distance=Math.hypot(x-demo.x,y-demo.y);
 demo.x=x;demo.y=y;placeCursor();
 if(demoReduced()||!demoCursor.animate||distance<2)return;
 // A hand travels on a slight arc, easing out of rest and settling onto the target.
 const bend=Math.min(40,distance*.08),mx=(from[0]+x)/2+(y-from[1])/distance*bend,my=(from[1]+y)/2-(x-from[0])/distance*bend;
 demo.move=demoCursor.animate([{transform:`translate(${from[0]}px,${from[1]}px)`},{transform:`translate(${mx}px,${my}px)`},{transform:`translate(${x}px,${y}px)`}],{duration:Math.round(Math.min(900,Math.max(380,240+distance*.65))),easing:'cubic-bezier(.45,0,.15,1)'});
 if(document.hidden)demo.move.pause();
 await demo.move.finished.catch(()=>{});demo.move=null;
}
function demoMoveTo(target,[fx,fy]=DEMO_AIM.action){const rect=target.getBoundingClientRect();return demoMoveToPoint(rect.left+rect.width*fx,rect.top+rect.height*fy);}
// Between beats the cursor rests on empty surface beside what it will touch next.
function demoRestBeside(target,dx,dy){const rect=target.getBoundingClientRect();return demoMoveToPoint(rect.left+rect.width/2+dx,rect.top+rect.height/2+dy);}
async function demoPress(target){
 demoCursor.classList.add('pressing');target.classList.add('is-demo-press');
 if(!demoReduced())demoCursor.querySelector('.demo-ring').animate?.([{transform:'translate(-50%,-50%) scale(.35)',opacity:.55},{transform:'translate(-50%,-50%) scale(1.5)',opacity:0}],{duration:460,easing:'cubic-bezier(.23,1,.32,1)'});
 await demoWait(120);
 demoCursor.classList.remove('pressing');target.classList.remove('is-demo-press');
}
function showDemoCursor(visible){
 if(visible){demoCursor.hidden=false;placeCursor();demoCursor.animate?.([{opacity:0},{opacity:1}],{duration:demoReduced()?0:240,easing:'ease-out'});return;}
 if(demoCursor.hidden)return;
 const fade=demoCursor.animate?.([{opacity:1},{opacity:0}],{duration:demoReduced()?0:180,easing:'ease-in'});
 if(fade)fade.onfinish=()=>{if(!demo.running)demoCursor.hidden=true;};else demoCursor.hidden=true;
}
function renderDemoToggle(){
 const toggle=$('#demo-toggle');toggle.setAttribute('aria-pressed',String(demo.running));
 $('#demo-label').textContent=demo.running?'Stop demo':'Watch demo';
}
function stopDemo(){
 if(!demo.running)return;
 demo.running=false;demo.token++;
 clearTimeout(demo.timer);demo.timer=null;demo.resolve=null;
 // Freeze the cursor where it is, then let it fade; the page keeps the state it reached.
 if(demo.move){const transform=getComputedStyle(demoCursor).transform;demo.move.cancel();demo.move=null;demoCursor.style.transform=transform;}
 demoCursor.classList.remove('pressing');document.querySelectorAll('.is-demo-press').forEach(node=>node.classList.remove('is-demo-press'));
 demoHover(null);showDemoCursor(false);renderDemoToggle();clearPointer();
}
// Beat timing: each hold is the reading time its result needs; the payoff holds longest.
const DEMO_BEATS={enter:900,readPlain:1900,hover:320,readFirst:1700,readPair:2300,refine:[2100,1800,2000],readCompare:3000,readPrompt:2200,handover:500,yourTurn:5000,invite:4000};
async function runDemo(){
 stopDemo();
 const token=++demo.token,live=()=>token===demo.token;
 demo.running=true;renderDemoToggle();
 promptPeeks.forEach(peek=>peek.close());
 if(view!=='dice')selectView('dice');
 if(!introMode)showBrief();
 scrollTo({top:0,behavior:'instant'});
 const next=$('#experiment-next'),die=$('#throw-0'),start=next.getBoundingClientRect();
 demo.x=Math.min(innerWidth-24,start.right+120);demo.y=Math.min(innerHeight-24,start.bottom+70);
 await demoWait(DEMO_BEATS.enter);if(!live())return;
 showDemoCursor(true);
 // 1. Read the plain page, then click the first die.
 const second=$('#throw-1');
 await demoWait(DEMO_BEATS.readPlain);if(!live())return;
 await demoMoveTo(die,DEMO_AIM.die);if(!live())return;demoHover(die);
 await demoWait(DEMO_BEATS.hover+80);if(!live())return;
 await demoPress(die);if(!live())return;demoHover(null);
 roll(0,null,[0,2]);
 // 2. Both dice land and the page changes. Roll the second die, and it changes again.
 await demoWait(160);if(!live())return;
 await demoRestBeside(die,demoNarrow()?60:0,demoNarrow()?70:120);if(!live())return;
 await demoWait(DEMO_BEATS.readFirst);if(!live())return;
 await demoMoveTo(second,DEMO_AIM.die);if(!live())return;demoHover(second);
 await demoWait(DEMO_BEATS.hover+80);if(!live())return;
 await demoPress(second);if(!live())return;demoHover(null);
 roll(1,null,[undefined,4]);
 await demoWait(160);if(!live())return;
 await demoRestBeside(second,demoNarrow()?-60:0,demoNarrow()?70:120);if(!live())return;
 await demoWait(DEMO_BEATS.readPair);if(!live())return;
 // 3. Refine the same pair three times with the same prompt.
 await demoMoveTo(next);if(!live())return;demoHover(next);
 for(const hold of DEMO_BEATS.refine){
  await demoWait(DEMO_BEATS.hover);if(!live())return;
  await demoPress(next);if(!live())return;
  next.click();
  await demoWait(hold);if(!live())return;
 }
 // 4. Compare the third pass with the plain page, side by side, then return. Phones hide Compare
 // (the slider does that job there), so the demo skips this beat.
 demoHover(null);
 const compareButton=$('#compare'),comparable=!!compareButton.offsetParent;
 if(comparable){
  await demoMoveTo(compareButton,[.5,.62]);if(!live())return;demoHover(compareButton);
  await demoWait(DEMO_BEATS.hover);if(!live())return;
  await demoPress(compareButton);if(!live())return;compareButton.click();demoHover(null);
  await demoRestBeside(compareButton,demoNarrow()?0:-150,demoNarrow()?50:40);if(!live())return;
  await demoWait(DEMO_BEATS.readCompare);if(!live())return;
  await demoMoveTo(compareButton,[.5,.62]);if(!live())return;
  await demoPress(compareButton);if(!live())return;compareButton.click();
 }
 // 5. Step aside, hand over, and point at what to try next.
 await demoRestBeside(comparable?compareButton:next,demoNarrow()?0:90,demoNarrow()?56:0);if(!live())return;
 await demoWait(DEMO_BEATS.handover);if(!live())return;
 demo.running=false;demo.token++;showDemoCursor(false);renderDemoToggle();
 if(innerWidth>860)showPointer($('#throw-0 .cube'),'Your turn.','Roll a die, or drag it to choose a face.','above');
 // One quiet invitation if the visitor has not touched anything yet: the dice hop once.
 const handover=demo.token;
 setTimeout(()=>{if(handover===demo.token&&!demo.running&&!introMode&&!document.hidden)inviteDice();},DEMO_BEATS.invite);
 setTimeout(()=>{if(pointer.custom?.title==='Your turn.')clearPointer();},DEMO_BEATS.yourTurn);
}
$('#demo-toggle').addEventListener('click',()=>demo.running?stopDemo():runDemo());
// Real input from the visitor ends the demo immediately; synthetic clicks from the demo do not.
const demoTakeover=event=>{
 if(!event.isTrusted||event.target?.closest?.('#demo-toggle,#pointer-demo'))return;
 if(demo.running)stopDemo();else{demo.token++;if(pointer.custom)clearPointer();}
};
['pointerdown','keydown','wheel','touchstart'].forEach(type=>addEventListener(type,demoTakeover,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!demo.running)return;if(document.hidden)demoHold();else demoContinue();});
// A width change moves every target; a phone's toolbar changing the height does not.
let demoWidth=innerWidth;
addEventListener('resize',()=>{if(demo.running&&innerWidth!==demoWidth)stopDemo();demoWidth=innerWidth;});
renderDemoToggle();
// A fresh visit opens on the plain page and waits for the visitor's own first roll; Watch demo plays the story.
