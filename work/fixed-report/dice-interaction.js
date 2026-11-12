const dieInteractions=new Map();
const diceFinePointer=matchMedia('(hover: hover) and (pointer: fine)');
const dieTick=(index,kind)=>{if(typeof playDieTick==='function')playDieTick(index,kind);};
function resetDieInteraction(index){dieInteractions.get(index)?.();}
function bindDieInteraction(button,index){
 let pointer=null,dragging=false,suppressPointerClick=false;
 const style=(key,value)=>button.style.setProperty(key,value);
 const reset=(settle=true)=>{
  const id=pointer?.id,wasHeld=!!pointer;pointer=null;dragging=false;
  if(id!==undefined&&button.hasPointerCapture(id))button.releasePointerCapture(id);
  button.removeAttribute('data-pressed');button.removeAttribute('data-dragging');button.removeAttribute('data-hover');
  ['--touch-x','--touch-y','--touch-z'].forEach(key=>style(key,'0deg'));style('--lean-x','0');style('--lean-y','0');
  if(wasHeld&&settle){suppressPointerClick=true;settleDieGrab(index);}
 };
 dieInteractions.set(index,reset);
 button.addEventListener('pointerenter',event=>{
  if(!diceFinePointer.matches||event.pointerType==='touch')return;
  button.dataset.hover='true';
  // A small anticipatory wobble, as if the die were picked up and weighed. `rotate` composes with the tilt.
  const grip=button.querySelector('.die-grip');
  if(grip?.animate&&!diceMotion.matches&&!dieStates[index].running&&!pointer)grip.animate([{rotate:'0deg'},{rotate:'-4deg',offset:.3},{rotate:'2.5deg',offset:.62},{rotate:'0deg'}],{duration:380,easing:'cubic-bezier(.33,1,.68,1)'});
 });
 button.addEventListener('pointerleave',()=>{if(!pointer)reset();});
 button.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||pointer)return;
  const now=performance.now();
  // Wake the sound on the press, so its one-time setup is done before the release throws the die.
  if(typeof primeDiceAudio==='function')primeDiceAudio();
  suppressPointerClick=false;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,from:beginDieGrab(index),samples:[{x:event.clientX,y:event.clientY,t:now}]};
  button.setPointerCapture(event.pointerId);button.dataset.pressed='true';
 });
 button.addEventListener('pointermove',event=>{
  if(pointer){
   if(event.pointerId!==pointer.id)return;
   const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y,now=performance.now();
   pointer.samples.push({x:event.clientX,y:event.clientY,t:now});
   pointer.samples=pointer.samples.filter(sample=>now-sample.t<=120);
   if(!dragging&&Math.hypot(dx,dy)>7){dragging=true;button.dataset.dragging='true';pointer.face=dieTopFace(pointer.from.q);dieTick(index,'lift');}
   if(dragging){
    event.preventDefault();const face=moveDieGrab(index,pointer.from,dx,dy);
    // Each new face that comes up clicks into place under the finger.
    if(face!==pointer.face){pointer.face=face;dieTick(index,'face');}
   }
   return;
  }
  if(!diceFinePointer.matches||event.pointerType==='touch'||diceMotion.matches||dieStates[index].running)return;
  button.dataset.hover='true';
  // Measured around the cube itself, so the lean is strongest right beside it.
  const cube=button.querySelector('.cube')?.getBoundingClientRect?.()||button.getBoundingClientRect(),reach=(cube.width||1)*1.1;
  const clamp=n=>Math.max(-1,Math.min(1,n)),x=clamp((event.clientX-cube.left-cube.width/2)/reach),y=clamp((event.clientY-cube.top-cube.height/2)/reach);
  style('--lean-x',x.toFixed(3));style('--lean-y',y.toFixed(3));
  style('--touch-x',(-y*18).toFixed(2)+'deg');style('--touch-y',(x*24).toFixed(2)+'deg');style('--touch-z',(x*8).toFixed(2)+'deg');
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
   // Let go of a carried die: a flick throws it with the hand's speed, a still hand drops it with the face
   // it shows on top. Either way it is guided to the page beside it.
   const release={velocity:[vx*1000,vy*1000],guided:true};
   if(speed>.6)roll(index,{direction:Math.sign(vx)||1,strength:Math.min(1,(speed-.6)/1.8),axis:[-vy/speed,0,vx/speed],flick:true,...release});
   else{dieTick(index,'set');const face=dieTopFace(dieStates[index].pose.q);if(typeof dropDie==='function')dropDie(index,face,release);else chooseDieFace(index,face);}
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
   dieTick(index,'set');chooseDieFace(index,dieTopFace(dieStates[index].pose.q));return;
  }
  if(event.key===' '||event.key==='Enter')button.dataset.pressed='true';
 });
 button.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter')button.removeAttribute('data-pressed');});
 button.addEventListener('blur',()=>reset());
 diceMotion.addEventListener('change',()=>reset());diceFinePointer.addEventListener('change',()=>reset());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
}
