const dieGlyphs=[
 '<path d="M21 37c-8-24 32-34 32-3v7H21Zm0 2c-18 2-7 20-19 17m26-15c-9 11 6 18-5 24m15-24c11 8-5 20 7 21m9-22c18-2 8 19 20 13"/><circle cx="30" cy="29" r="2"/><circle cx="44" cy="29" r="2"/>',
 '<path d="m7 20 29-13 29 13H7Zm7 8v27m15-27v27m15-27v27m15-27v27M8 63h56M5 57h62"/>',
 '<path d="M15 43c-17-9-4-27 8-21 2-20 31-20 34-1 18-1 22 26 5 28H18m2 8-3 8m20-8-3 8m20-8-3 8"/>',
 '<path d="M17 6h38v59H17Zm9 13h20m-20 10h20m-20 10h20m-20 10h13M9 14v57h37"/>',
 '<path d="m12 38 9-18h30l10 18 6 5v13H6V43Zm9-18 8 18h23M20 38h41M15 56v8m42-8v8M4 12h17m-17 9h9"/>',
 '<path d="M16 35c0-31 40-31 40 0Z M23 36c-9 11 10 16 0 27m13-27c9 9-9 17 0 29m13-29c-9 11 10 16 0 27M36 3v4M8 16l4 3m48-3 4-3"/><circle cx="9" cy="45" r="2"/><circle cx="63" cy="49" r="2"/><circle cx="29" cy="27" r="1"/><circle cx="43" cy="27" r="1"/>'
];
const formatGlyphs={insects:'<path d="M7 7h58v58H7ZM36 13v46m-9-40-5-5m23 5 5-5M25 31l-9-4m31 4 9-4M24 42l-8 6m32-6 8 6M28 52l-5 7m21-7 5 7"/><ellipse cx="36" cy="39" rx="12" ry="17"/><circle cx="36" cy="21" r="5"/>',tech:'<circle cx="36" cy="36" r="24"/><path d="M36 4v17m0 30v17M4 36h17m30 0h17m-15-25-17 25h14"/>',disco:'<circle cx="36" cy="36" r="28"/><circle cx="36" cy="36" r="10"/><path d="M16 35a20 20 0 0 1 19-19m20 20a20 20 0 0 1-19 19"/>',diner:'<path d="M10 30c0-29 52-29 52 0H10Zm0 9h52M10 48h52c0 21-52 21-52 0ZM22 20h2m12-5h2m12 5h2"/>',opera:'<path d="M8 8h56v56H8ZM8 10q26 14 0 42m56-42q-26 14 0 42M23 64V43h26v21"/>',hotel:'<path d="M12 65V23h48v42M7 23h58L36 5Zm17 10h5m14 0h5M24 44h5m14 0h5M30 65V53h12v12"/>',swiss:'<path d="M7 7h58v58H7Zm0 20h58M27 7v58M7 48h58"/>',brutalist:'<path d="M9 7h54v15H9Zm0 24h20v34H9Zm31 0h23v34H40Z"/>',deco:'<path d="M9 62V29h9V17h9V8h18v9h9v12h9v33M20 62V37h11V24h10v13h11v25"/>',playful:'<path d="M8 27c-1-25 30-26 29-2 10-23 34-12 26 9-5 19-28 33-28 33S8 48 8 27Z"/>',editorial:'<path d="M7 9h58v54H7Zm9 11h40M16 29h18v23H16Zm28 0h12m-12 9h12m-12 9h12"/>',transit:'<path d="M10 58V14h24v23h26v25"/><circle cx="10" cy="14" r="4"/><circle cx="34" cy="37" r="6"/><circle cx="60" cy="62" r="4"/>',receipt:'<path d="m17 5 6 5 6-5 7 5 7-5 6 5 6-5v62l-6-5-6 5-7-5-7 5-6-5-6 5Zm9 18h20m-20 10h20m-20 10h20m-20 10h10"/>',guide:'<path d="M7 12q15-6 29 4 14-10 29-4v49q-16-5-29 4-14-9-29-4Zm29 4v49M16 24h11m-11 10h11m18-10h11m-11 10h11"/>',circuit:'<path d="M6 12h23v18h20v22h17M6 60h24V42h19V12h17"/><circle cx="29" cy="30" r="4"/><circle cx="49" cy="42" r="4"/>',quilt:'<path d="M7 7h58v58H7Zm29 0v58M7 36h58M7 7l58 58M7 65 65 7"/>'};
const diceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const dieStates=[0,1].map(()=>({value:null,pose:{q:[0,0,0,1],x:0,y:0},running:null}));
let activeDiceRoll=null;
const dieInvitations=new Map();
function clearDieInvitation(i){clearTimeout(dieInvitations.get(i));dieInvitations.delete(i);}
function inviteDice(){
 if(diceMotion.matches||document.hidden||view!=='dice')return;
 [0,1].forEach(i=>dieInvitations.set(i,setTimeout(()=>{
  dieInvitations.delete(i);if(dieStates[i].running||diceMotion.matches||document.hidden)return;
  const size=$('#throw-'+i+' .cube').clientWidth;
  animateDiePlan(i,{kind:'invitation',from:dieStates[i].pose,size,duration:850,contacts:[]},dieStates[i].value);
 },450+i*300)));
}
function diePicture(index,value){const path=index===0?dieGlyphs[value]:formatGlyphs[modes[active].options[value].layout];return `<svg viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${path}</svg>`;}
function dieFaceMarkup(index){return DIE_FACE_VALUES.map((choice,face)=>`<span class="cube-face face-${face}" data-choice="${choice}">${diePicture(index,choice)}<small>${String(choice+1).padStart(2,'0')}</small></span>`).join('');}
function initDice3D(){
 document.querySelectorAll('.die').forEach((die,i)=>{
  const button=document.createElement('button');button.className='die-object';button.type='button';button.id='throw-'+i;
  button.setAttribute('aria-describedby','dice-gesture-help');
  button.innerHTML='<span class="die-shadow" aria-hidden="true"></span><span class="die-grip" aria-hidden="true"><span class="die-flight"><span class="die-camera"><span class="cube">'+dieFaceMarkup(i)+'</span></span></span></span>';
  die.querySelector('.die-top').after(button);bindDieInteraction(button,i);
 });
 const settle=()=>[0,1].forEach(i=>stopDieMotion(i));
 diceMotion.addEventListener('change',()=>{if(diceMotion.matches)settle();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)stopDieMotion(Number(entry.target.id.slice(-1)));}));
 [0,1].forEach(i=>observer.observe(document.querySelector('#throw-'+i)));
}
function paintDiePose(i,pose){
 $('#throw-'+i+' .cube').style.transform=quatCSS(pose.q);
 $('#throw-'+i+' .die-flight').style.transform=`translate3d(${pose.x}px,${pose.y}px,0)`;
 const shadow=$('#throw-'+i+' .die-shadow'),height=Math.min(1,(pose.air??Math.max(0,-pose.y))/40);
 shadow.style.transform=`translateX(${pose.x}px) scale(${1-height*.32},${1-height*.44})`;shadow.style.opacity=String(1-height*.65);
}
function syncDice3D(){
 [a,b].forEach((value,i)=>{
  const button=$('#throw-'+i),state=dieStates[i],name=i?modes[active].options[value].name:worlds[value].name;
  button.setAttribute('aria-label',typeof introMode!=='undefined'&&introMode?`Roll both ingredients. ${i?'Second':'First'} die`:`Roll ${i?'second':'first'} die${state.running?' again':''}. ${name}`);
  if(state.running)return;
  if(state.value!==value){state.value=value;state.pose={q:dieLanding(value),x:0,y:0};}
  paintDiePose(i,state.pose);
 });
}
function releaseDieAnimation(i){
 const state=dieStates[i],running=state.running;
 if(running){state.pose=sampleDiePlan(running.plan,dieClamp(Number(running.animations[0].currentTime||0)/running.plan.duration));running.animations.forEach(animation=>animation.cancel());state.running=null;paintDiePose(i,state.pose);}
 return state.pose;
}
function finishDie(i){
 const state=dieStates[i],running=state.running;
 if(!running)return;
 state.pose=sampleDiePlan(running.plan,1);state.value=running.value;state.running=null;
 paintDiePose(i,state.pose);running.animations.forEach(animation=>animation.cancel());
 if(activeDiceRoll){activeDiceRoll.remaining.delete(i);if(!activeDiceRoll.remaining.size){const complete=activeDiceRoll.complete;activeDiceRoll=null;complete();}}
}
function stopDieMotion(i){clearDieInvitation(i);resetDieInteraction(i);finishDie(i);}
function cancelDiceRoll(){activeDiceRoll=null;[0,1].forEach(i=>{clearDieInvitation(i);resetDieInteraction(i);releaseDieAnimation(i);dieStates[i].value=null;});}
function beginDieGrab(i){clearDieInvitation(i);activeDiceRoll=null;return releaseDieAnimation(i);}
function moveDieGrab(i,from,dx,dy=0){
 const size=$('#throw-'+i+' .cube').clientWidth||104;
 dieStates[i].pose=dieGrabPose(from,dx,dy,size);
 paintDiePose(i,dieStates[i].pose);
 const value=dieTopFace(dieStates[i].pose.q);
 $('#ingredient-'+(i?'b':'a')).textContent=i?modes[active].options[value].name:worlds[value].name;
 return value;
}
function settleDieGrab(i,keepYaw=false){
 const state=dieStates[i],value=i?b:a,size=$('#throw-'+i+' .cube').clientWidth||104;
 const plan={kind:'settle',from:state.pose,target:keepYaw?dieSnap(state.pose.q,value):dieLanding(value),size,duration:180,contacts:[]};
 $('#ingredient-'+(i?'b':'a')).textContent=typeof introMode!=='undefined'&&introMode?'Ingredient '+(i+1):i?modes[active].options[value].name:worlds[value].name;
 if(diceMotion.matches||document.hidden){state.pose=sampleDiePlan(plan,1);state.value=value;paintDiePose(i,state.pose);return;}
 animateDiePlan(i,plan,value);
}
function animateDiePlan(i,plan,value){
 const state=dieStates[i];
 // Exact contact times keep the short impacts visible between regular samples.
 const times=[...new Set([...Array.from({length:67},(_,n)=>n/66),...plan.contacts])].sort((x,y)=>x-y);
 const rotation=[],flight=[],shadow=[];
 for(const t of times){const pose=sampleDiePlan(plan,t),height=Math.min(1,pose.air/40);rotation.push({offset:t,transform:quatCSS(pose.q)});flight.push({offset:t,transform:`translate3d(${pose.x}px,${pose.y}px,0)`});shadow.push({offset:t,transform:`translateX(${pose.x}px) scale(${1-height*.32},${1-height*.44})`,opacity:1-height*.65});}
 const options={duration:plan.duration,easing:'linear',fill:'forwards'};
 const animations=[$('#throw-'+i+' .cube').animate(rotation,options),$('#throw-'+i+' .die-flight').animate(flight,options),$('#throw-'+i+' .die-shadow').animate(shadow,options)];
 state.running={plan,animations,value};
 animations[0].onfinish=()=>{if(state.running?.animations===animations)finishDie(i);};
}
function tumbleDice(indices,values,complete,gesture=null){
 // Snapshot the current pose before cancelling: a second throw continues in flight.
 const from=dieStates.map((state,i)=>indices.includes(i)?releaseDieAnimation(i):state.pose);
 // Reroll only the clicked die. Any other die already in flight keeps its motion.
 activeDiceRoll={remaining:new Set([...indices,...[0,1].filter(i=>dieStates[i].running)]),complete};
 if(diceMotion.matches||document.hidden){
  [...activeDiceRoll.remaining].forEach(i=>{releaseDieAnimation(i);dieStates[i].pose={q:dieLanding(values[i]),x:0,y:0};dieStates[i].value=values[i];paintDiePose(i,dieStates[i].pose);});
  activeDiceRoll=null;complete();return;
 }
 indices.forEach(i=>{
  clearDieInvitation(i);
  const cube=$('#throw-'+i+' .cube'),width=cube.clientWidth||116,travel=Math.max(6,Math.min(20,($('#throw-'+i).clientWidth-width*1.2)/2+8)),plan=makeDiePlan(from[i],values[i],Math.random,width,Number.isFinite(travel)?travel:18,gesture);
  animateDiePlan(i,plan,values[i]);
  const name=i?modes[active].options[values[i]].name:worlds[values[i]].name;
  $('#throw-'+i).setAttribute('aria-label',`Roll ${i?'second':'first'} die again. ${name}`);
 });
}
