// Authored demo: a cursor runs the story once on the real controls. Every state it reaches is the
// real page state, so any visitor input takes over at once from exactly what is on screen.
const demo={running:false,token:0,timer:null,resolve:null,remaining:0,started:0,move:null,x:0,y:0,hovered:null};
const demoCursor=$('#demo-cursor');
const demoReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
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
async function demoMoveTo(target,fx=.6,fy=.62){
 const rect=target.getBoundingClientRect(),x=rect.left+rect.width*fx,y=rect.top+rect.height*fy;
 const from=`translate(${demo.x}px,${demo.y}px)`,distance=Math.hypot(x-demo.x,y-demo.y);
 demo.x=x;demo.y=y;placeCursor();
 if(demoReduced()||!demoCursor.animate)return;
 // Travel time follows distance; the path eases out of rest and settles onto the target.
 demo.move=demoCursor.animate([{transform:from},{transform:`translate(${x}px,${y}px)`}],{duration:Math.round(Math.min(980,Math.max(420,280+distance*.7))),easing:'cubic-bezier(.45,0,.12,1)'});
 if(document.hidden)demo.move.pause();
 await demo.move.finished.catch(()=>{});demo.move=null;
}
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
 demoHover(null);showDemoCursor(false);renderDemoToggle();
}
async function runDemo(){
 stopDemo();
 const token=++demo.token,live=()=>token===demo.token;
 demo.running=true;renderDemoToggle();
 promptPeeks.forEach(peek=>peek.close());
 if(view!=='dice')selectView('dice');
 if(!introMode)showBrief();
 scrollTo({top:0,behavior:'instant'});
 const next=$('#experiment-next'),start=next.getBoundingClientRect();
 demo.x=Math.min(innerWidth-24,start.right+140);demo.y=Math.min(innerHeight-24,start.bottom+80);showDemoCursor(true);
 // 1. Read the plain page, then add randomness.
 await demoWait(1300);if(!live())return;
 await demoMoveTo(next);if(!live())return;demoHover(next);
 await demoWait(380);if(!live())return;
 await demoPress(next);if(!live())return;demoHover(null);
 roll(undefined,null,[5,2]);
 // 2. Let the dice land and the page be read, then swap one ingredient.
 await demoWait(2500);if(!live())return;
 const die=$('#throw-0');
 await demoMoveTo(die,.5,.42);if(!live())return;demoHover(die);
 await demoWait(460);if(!live())return;
 await demoPress(die);if(!live())return;demoHover(null);
 roll(0,null,[0]);
 await demoWait(2400);if(!live())return;
 // 3. Refine the same pair three times with the same prompt.
 await demoMoveTo(next);if(!live())return;demoHover(next);
 for(const hold of [2500,2200,2600]){
  await demoWait(340);if(!live())return;
  await demoPress(next);if(!live())return;
  next.click();
  await demoWait(hold);if(!live())return;
 }
 // 4. Step aside onto empty surface and hand over.
 demoHover(null);
 await demoMoveTo(next,1.45,.5);if(!live())return;
 await demoWait(500);if(!live())return;
 demo.running=false;demo.token++;showDemoCursor(false);renderDemoToggle();
}
$('#demo-toggle').addEventListener('click',()=>demo.running?stopDemo():runDemo());
// Real input from the visitor ends the demo immediately; synthetic clicks from the demo do not.
const demoTakeover=event=>{if(event.isTrusted&&demo.running&&!event.target?.closest?.('#demo-toggle'))stopDemo();};
['pointerdown','keydown','wheel','touchstart'].forEach(type=>addEventListener(type,demoTakeover,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!demo.running)return;if(document.hidden)demoHold();else demoContinue();});
// A width change moves every target; a phone's toolbar changing the height does not.
let demoWidth=innerWidth;
addEventListener('resize',()=>{if(demo.running&&innerWidth!==demoWidth)stopDemo();demoWidth=innerWidth;});
renderDemoToggle();
// A fresh visit opens on the plain page and plays the story once.
if(introMode&&view==='dice'&&!params.has('start')&&!demoReduced())runDemo();
