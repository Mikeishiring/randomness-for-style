const dieInteractions=new Map();
const diceFinePointer=matchMedia('(hover: hover) and (pointer: fine)');
function resetDieInteraction(index){dieInteractions.get(index)?.();}
function bindDieInteraction(button,index){
 let pointer=null,dragging=false,suppressPointerClick=false;
 const style=(key,value)=>button.style.setProperty(key,value);
 const reset=(settle=true)=>{
  const id=pointer?.id,wasHeld=!!pointer;pointer=null;dragging=false;
  if(id!==undefined&&button.hasPointerCapture(id))button.releasePointerCapture(id);
  button.removeAttribute('data-pressed');button.removeAttribute('data-dragging');button.removeAttribute('data-hover');
  style('--touch-x','0deg');style('--touch-z','0deg');
  if(wasHeld&&settle){suppressPointerClick=true;settleDieGrab(index);}
 };
 dieInteractions.set(index,reset);
 button.addEventListener('pointerenter',event=>{if(diceFinePointer.matches&&event.pointerType!=='touch')button.dataset.hover='true';});
 button.addEventListener('pointerleave',()=>{if(!pointer)reset();});
 button.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||pointer)return;
  const now=performance.now();
  suppressPointerClick=false;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,from:beginDieGrab(index),samples:[{x:event.clientX,y:event.clientY,t:now}]};
  button.setPointerCapture(event.pointerId);button.dataset.pressed='true';
 });
 button.addEventListener('pointermove',event=>{
  if(pointer){
   if(event.pointerId!==pointer.id)return;
   const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y,now=performance.now();
   pointer.samples.push({x:event.clientX,y:event.clientY,t:now});
   pointer.samples=pointer.samples.filter(sample=>now-sample.t<=120);
   if(!dragging&&Math.hypot(dx,dy)>7){dragging=true;button.dataset.dragging='true';}
   if(dragging){event.preventDefault();moveDieGrab(index,pointer.from,dx,dy);}
   return;
  }
  if(!diceFinePointer.matches||event.pointerType==='touch'||diceMotion.matches||dieStates[index].running)return;
  button.dataset.hover='true';
  const rect=button.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*2-1,y=(event.clientY-rect.top)/rect.height*2-1;
  style('--touch-x',Math.max(-4,Math.min(4,-y*4))+'deg');style('--touch-z',Math.max(-4,Math.min(4,x*4))+'deg');
 });
 button.addEventListener('pointerup',event=>{
  if(!pointer||event.pointerId!==pointer.id)return;
  const wasDragging=dragging,now=performance.now(),rect=button.getBoundingClientRect();
  const inside=event.clientX>=rect.left&&event.clientX<=rect.left+rect.width&&event.clientY>=rect.top&&event.clientY<=rect.top+rect.height;
  // Only recent motion counts. Dragging far and holding still chooses a face.
  const recent=pointer.samples.filter(sample=>now-sample.t<=100),first=recent[0];
  const dt=first?Math.max(16,now-first.t):1,vx=first?(event.clientX-first.x)/dt:0,vy=first?(event.clientY-first.y)/dt:0,speed=Math.hypot(vx,vy);
  if(wasDragging)moveDieGrab(index,pointer.from,event.clientX-pointer.x,event.clientY-pointer.y);
  reset(!wasDragging&&!inside);
  if(wasDragging){
   suppressPointerClick=true;
   if(speed>.6)roll(index,{direction:Math.sign(vx)||1,strength:Math.min(1,(speed-.6)/1.8),axis:[-vy/speed,0,vx/speed]});
   else chooseDieFace(index,dieTopFace(dieStates[index].pose.q));
  }else if(!inside)suppressPointerClick=true;
 });
 const cancel=event=>{if(pointer&&event.pointerId===pointer.id){suppressPointerClick=true;reset();}};
 button.addEventListener('pointercancel',cancel);button.addEventListener('lostpointercapture',cancel);
 button.addEventListener('click',event=>{if(event.detail&&suppressPointerClick){suppressPointerClick=false;return;}reset(false);roll(index);});
 button.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&pointer){event.preventDefault();suppressPointerClick=true;reset();return;}
  if(event.key.startsWith('Arrow')){
   event.preventDefault();reset();const from=beginDieGrab(index),size=button.querySelector('.cube').clientWidth||94;
   moveDieGrab(index,from,event.key==='ArrowRight'?size:event.key==='ArrowLeft'?-size:0,event.key==='ArrowDown'?size:event.key==='ArrowUp'?-size:0);
   chooseDieFace(index,dieTopFace(dieStates[index].pose.q));return;
  }
  if(event.key===' '||event.key==='Enter')button.dataset.pressed='true';
 });
 button.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter')button.removeAttribute('data-pressed');});
 button.addEventListener('blur',()=>reset());
 diceMotion.addEventListener('change',()=>reset());diceFinePointer.addEventListener('change',()=>reset());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
}
