// Keep the previous saved page visible while its replacement paints in the same frame.
// This is presentation only: selection, controls and the new document update immediately.
const reportHandoffs=new WeakMap();
function releaseReportHandoff(container,keepCover=false){
 const active=reportHandoffs.get(container);if(!active)return;
 const cover=active.frame.dataset.loaded==='true'?active.incoming:active.previous;
 reportHandoffs.delete(container);active.animation?.cancel();
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
function handoffReport(container,previous,incoming){
 if(!previous||previous===incoming||!previous.animate)return;
 const frame=incoming.querySelector('iframe');
 if(previous.querySelector('iframe').srcdoc===frame.srcdoc)return;
 const active={previous,incoming,frame,animation:null,reveal:null,immediate:false};reportHandoffs.set(container,active);
 previous.hidden=false;previous.inert=true;previous.setAttribute('aria-hidden','true');previous.classList.add('report-outgoing');
 active.reveal=()=>{
  if(reportHandoffs.get(container)!==active||active.animation)return;
  frame.dataset.loaded='true';frame.removeEventListener('load',active.reveal);
  if(active.immediate||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){releaseReportHandoff(container);return;}
  active.animation=previous.animate([{opacity:1},{opacity:0}],{duration:180,easing:'cubic-bezier(.4,0,.2,1)'});
  active.animation.onfinish=()=>{if(reportHandoffs.get(container)===active)settleReportHandoff(container);};
 };
 if(frame.dataset.loaded==='true')active.reveal();
 else frame.addEventListener('load',active.reveal,{once:true});
}
