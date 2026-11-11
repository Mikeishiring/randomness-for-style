// Keep the previous saved page visible while its replacement paints in the same frame,
// then wipe it away so the new design reads as printed over the old one.
// This is presentation only: selection, controls and the new document update immediately.
// A refinement prints over from the top. A die throw waits for the die to reach the page and
// wipes away from the edge it struck, so the change visibly starts where the die hit.
const REPORT_REVEAL={duration:560,easing:'cubic-bezier(.65,0,.35,1)'};
const REPORT_KNOCK_REVEAL={duration:640,easing:'cubic-bezier(.16,1,.3,1)'};
const REPORT_WIPES={top:'inset(100% 0 0 0)',left:'inset(0 0 0 100%)',right:'inset(0 100% 0 0)',both:'inset(0 50% 0 50%)'};
const reportHandoffs=new WeakMap();
// The page change a throw causes. The rendered change claims it; it lands when a die reaches the
// page, or at once when that throw is interrupted, so a page never waits on a die that will not arrive.
const reportImpacts={next:null};
function reportImpactFor(render){
 const impact={landed:false,origin:'top',waiters:[]};
 reportImpacts.next=impact;
 try{render();}finally{reportImpacts.next=null;}
 return impact;
}
function aimReportImpact(impact,sides){
 if(!impact||impact.landed)return;
 impact.origin=sides.includes('left')&&sides.includes('right')?'both':sides[0]||'top';
}
function landReportImpact(impact){
 if(!impact||impact.landed)return;
 impact.landed=true;
 const waiters=impact.waiters;impact.waiters=[];waiters.forEach(run=>run(impact.origin));
}
function hitReport(impact,hit){
 if(hit.knock)knockReport(hit);
 landReportImpact(impact);
}
// The struck page gives first: its struck edge compresses for a frame or two, then the whole page
// takes a small shove away from the die and springs back. A ring in the die's colour marks the contact.
function knockReport(hit){
 const view=document.querySelector?.('#report-view');
 if(!view?.animate||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const rect=view.getBoundingClientRect(),away=hit.side==='left'?1:-1,force=.65+.55*Math.max(0,Math.min(1,hit.strength||0));
 const lever=Math.max(-1,Math.min(1,(hit.y-rect.height/2)/(rect.height/2||1))),turn=-lever*away*.3*force;
 const spring='cubic-bezier(.33,1,.68,1)',origin=`${away>0?'100%':'0%'} ${Math.round(hit.y)}px`;
 view.animate([
  {transform:'none',transformOrigin:origin,easing:'cubic-bezier(.2,0,.4,1)'},
  {transform:`translateX(${2*force*away}px) scaleX(${1-.007*force})`,transformOrigin:origin,offset:.07,easing:spring},
  {transform:`translateX(${7*force*away}px) rotate(${turn}deg)`,transformOrigin:origin,offset:.2,easing:spring},
  {transform:`translateX(${-2.4*force*away}px) rotate(${-turn*.4}deg)`,transformOrigin:origin,offset:.4,easing:spring},
  {transform:`translateX(${.9*force*away}px)`,transformOrigin:origin,offset:.6,easing:spring},
  {transform:`translateX(${-.3*force*away}px)`,transformOrigin:origin,offset:.8,easing:spring},
  {transform:'none',transformOrigin:origin}
 ],{duration:680});
 const mark=document.createElement('span');mark.className='report-knock';mark.dataset.die=String(hit.die);
 mark.style.left=hit.side==='left'?'0':'100%';mark.style.top=Math.max(12,Math.min(rect.height-12,hit.y))+'px';
 view.append(mark);
 mark.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:.9},{transform:'translate(-50%,-50%) scale(1.15)',opacity:.55,offset:.35},{transform:'translate(-50%,-50%) scale(1.9)',opacity:0}],{duration:560,easing:'cubic-bezier(.16,1,.3,1)'}).onfinish=()=>mark.remove();
}
function releaseReportHandoff(container,keepCover=false){
 const active=reportHandoffs.get(container);if(!active)return;
 const cover=active.frame.dataset.loaded==='true'?active.incoming:active.previous;
 reportHandoffs.delete(container);active.animation?.cancel();active.sweeps.forEach(sweep=>sweep.cancel());if(active.frame.style)active.frame.style.transition='';
 active.frame.removeEventListener('load',active.reveal);
 active.previous.hidden=!(keepCover&&cover===active.previous);active.previous.inert=false;
 active.previous.removeAttribute('aria-hidden');active.previous.classList.remove('report-outgoing');
 return keepCover?cover:null;
}
function takeReportCover(container){return releaseReportHandoff(container,true);}
function settleReportHandoff(container){
 const active=reportHandoffs.get(container);if(!active)return;
 active.immediate=true;
 if(active.frame.dataset.loaded==='true')releaseReportHandoff(container);
}
// A lateral wipe leaves a vertical vermilion edge travelling with it; the top wipe keeps the horizontal one.
function reportSweeps(container,origin,previous){
 const box=previous.getBoundingClientRect?.();if(!box?.height||!container.querySelector)return [];
 const timing=origin==='top'?REPORT_REVEAL:REPORT_KNOCK_REVEAL;
 if(origin==='top'){const sweep=container.querySelector('.report-sweep');return sweep?.animate?[sweep.animate([{transform:'translateY(0)',opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.88},{transform:`translateY(${box.height}px)`,opacity:0}],timing)]:[];}
 const edges=origin==='both'?[['left',box.width/2],['right',box.width/2]]:[[origin,box.width]];
 return edges.map(([from,distance],n)=>{
  let sweep=container.querySelectorAll?.('.report-sweep-x')[n];
  if(!sweep){sweep=document.createElement('span');sweep.className='report-sweep-x';sweep.setAttribute('aria-hidden','true');container.append(sweep);}
  const start=from==='left'?0:box.width,end=from==='left'?distance:box.width-distance;
  return sweep.animate([{transform:`translateX(${start}px)`,opacity:0},{opacity:1,offset:.06},{opacity:1,offset:.82},{transform:`translateX(${end}px)`,opacity:0}],timing);
 });
}
function handoffReport(container,previous,incoming){
 const impact=reportImpacts.next;reportImpacts.next=null;
 if(!previous||previous===incoming||!previous.animate)return;
 const frame=incoming.querySelector('iframe');
 if(previous.querySelector('iframe').srcdoc===frame.srcdoc)return;
 const active={previous,incoming,frame,impact,animation:null,sweeps:[],reveal:null,immediate:false};reportHandoffs.set(container,active);
 if(frame.style)frame.style.transition='none';
 previous.hidden=false;previous.inert=true;previous.setAttribute('aria-hidden','true');previous.classList.add('report-outgoing');
 const wipe=origin=>{
  if(reportHandoffs.get(container)!==active||active.animation)return;
  if(active.immediate){releaseReportHandoff(container);return;}
  const timing=origin==='top'?REPORT_REVEAL:REPORT_KNOCK_REVEAL;
  active.animation=previous.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:REPORT_WIPES[origin]||REPORT_WIPES.top}],timing);
  active.sweeps=reportSweeps(container,origin,previous);
  if(origin!=='top'&&typeof playReportSwish==='function')playReportSwish(origin,timing.duration);
  active.animation.onfinish=()=>{if(reportHandoffs.get(container)===active){settleReportHandoff(container);if(typeof reportHandoffSettled==='function')reportHandoffSettled(container);}};
 };
 active.reveal=()=>{
  if(reportHandoffs.get(container)!==active||active.animation)return;
  frame.dataset.loaded='true';frame.removeEventListener('load',active.reveal);
  if(active.immediate||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){releaseReportHandoff(container);return;}
  // A thrown die is still in the air: the old page holds until it arrives.
  if(impact&&!impact.landed){impact.waiters.push(wipe);return;}
  wipe(impact?.origin||'top');
 };
 if(frame.dataset.loaded==='true')active.reveal();
 else frame.addEventListener('load',active.reveal,{once:true});
}
