// Hover/focus previews; a click keeps the exact prompt available to inspect.
function bindPromptPeek(root){
 const trigger=root.querySelector('.prompt-trigger'),panel=root.querySelector('.prompt-panel');
 const pin=panel.querySelector('.prompt-pin'),close=panel.querySelector('.prompt-close');
 let pinned=false,hovered=false,suppressed=false,timer;
 const cancelTimer=()=>clearTimeout(timer);
 const show=()=>{cancelTimer();if(suppressed)return;panel.hidden=false;trigger.setAttribute('aria-expanded','true');};
 const dismiss=(restoreFocus=false)=>{
  cancelTimer();pinned=false;suppressed=true;panel.hidden=true;
  trigger.setAttribute('aria-expanded','false');pin.setAttribute('aria-pressed','false');pin.textContent='Pin';
  if(restoreFocus)trigger.focus({preventScroll:true});
 };
 const setPinned=value=>{pinned=value;suppressed=false;show();pin.setAttribute('aria-pressed',String(value));pin.textContent=value?'Pinned':'Pin';};
 const scheduleClose=()=>{cancelTimer();timer=setTimeout(()=>{if(!pinned&&!hovered&&!root.contains(document.activeElement))dismiss();},150);};
 root.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;hovered=true;suppressed=false;show();});
 root.addEventListener('pointerleave',()=>{hovered=false;suppressed=false;scheduleClose();});
 root.addEventListener('focusin',event=>{if(!root.contains(event.relatedTarget))suppressed=false;show();});
 root.addEventListener('focusout',event=>{if(!root.contains(event.relatedTarget)){suppressed=false;scheduleClose();}});
 trigger.addEventListener('click',()=>{if(pinned)dismiss();else setPinned(true);});
 pin.addEventListener('click',()=>setPinned(!pinned));
 close.addEventListener('click',()=>dismiss(true));
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();dismiss(true);}});
 document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!root.contains(event.target))dismiss();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)dismiss(root.contains(document.activeElement));});
 return {close:()=>dismiss(),open:()=>setPinned(true)};
}

function showPrompt(pre,text,addition=''){
 pre.replaceChildren();
 const start=addition?text.indexOf(addition):-1;
 if(start<0){pre.textContent=text;return;}
 for(const [tag,part] of [['span',text.slice(0,start)],['mark',addition],['span',text.slice(start+addition.length)]]){
  const node=document.createElement(tag);node.textContent=part;pre.append(node);
 }
}
