// Die glyphs: bold strokes in the face ink, one accent detail each (eyes, bolt, lure, chip core...).
const dieGlyphs=[
 '<path fill="currentColor" stroke="none" d="M19 36c0-12 7.5-21 17-21s17 9 17 21v3H19Z"/><circle class="ga" stroke="none" cx="29.5" cy="30" r="3.2"/><circle class="ga" stroke="none" cx="42.5" cy="30" r="3.2"/><path d="M23 39c-1 9-9 9-9 17M31 39c0 8-4 12-2 19M41 39c0 8 4 12 2 19M49 39c1 9 9 9 9 17"/>',
 '<path d="M13 17h46"/><path d="M19 17c-6 0-6.5 8-.5 8 3.5 0 4-4.5 1-4.5M53 17c6 0 6.5 8 .5 8-3.5 0-4-4.5-1-4.5"/><path d="M22 25h28M26 25v28M33 25v28M39 25v28M46 25v28"/><path class="ga-s" d="M20 53h32"/><path d="M15 60h42"/>',
 '<path d="M21 44a10 10 0 0 1 1.5-19.8A14 14 0 0 1 49 25a9.5 9.5 0 0 1 1 19Z"/><path class="ga" stroke="none" d="M38 41 29 55h7.5l-4 12L45 50h-7.5l5-9Z"/>',
 '<circle cx="36" cy="14" r="7"/><path d="M32.5 21 30 33h12l-2.5-12"/><rect fill="currentColor" stroke="none" x="14" y="33" width="44" height="10" rx="2.5"/><path class="ga-s" d="M15 53h42"/><path d="M21 61h30" opacity=".55"/>',
 '<path d="M17 63V9"/><path d="M17 11h38v27H17"/><path fill="currentColor" stroke="none" d="M17 11h9.5v9H17ZM36 11h9.5v9H36ZM26.5 20H36v9h-9.5ZM45.5 20H55v9h-9.5ZM17 29h9.5v9H17ZM36 29h9.5v9H36Z"/>',
 '<path d="M13 43c7-14 27-17 38-6l9-7v22l-9-7c-11 11-31 8-38-2Z"/><path d="M13 43l4 3 3.5-3 3.5 3"/><circle fill="currentColor" stroke="none" cx="25" cy="38" r="2.6"/><path d="M27 32c-2-11 6-17 15-15"/><circle class="ga" stroke="none" cx="44" cy="17" r="4.2"/><circle class="ga-s" cx="44" cy="17" r="8.5" opacity=".45" stroke-width="2"/>'
];
const formatGlyphs={tech:'<rect x="19" y="19" width="34" height="34" rx="5"/><rect class="ga" stroke="none" x="28" y="28" width="16" height="16" rx="2.5"/><path d="M28 10v9M36 10v9M44 10v9M28 53v9M36 53v9M44 53v9M10 28h9M10 36h9M10 44h9M53 28h9M53 36h9M53 44h9"/>',disco:'<path d="M36 5v12"/><circle cx="36" cy="39" r="21"/><ellipse cx="36" cy="39" rx="9.5" ry="21"/><path d="M15 39h42M18 29h36M18 49h36"/><path class="ga-s" d="M60 9v10M55 14h10"/>',diner:'<path d="M15 33c0-10.5 9.5-17 21-17s21 6.5 21 17Z"/><path class="ga-s" d="M13 39c4 3.5 7.5-3.5 11.5 0s7.5 3.5 11.5 0 7.5-3.5 11.5 0 7.5 3.5 11.5 0"/><rect fill="currentColor" stroke="none" x="14" y="44" width="44" height="7" rx="3.5"/><path d="M15 56h42v1.5a6.5 6.5 0 0 1-6.5 6.5h-29A6.5 6.5 0 0 1 15 57.5Z"/>',opera:'<path d="M9 11h54"/><path d="M12 11c0 19 3.5 34 12 50M60 11c0 19-3.5 34-12 50M12 11c4 7 9 9 15 9M60 11c-4 7-9 9-15 9"/><path class="ga-s" d="M39 28v19M39 28l7 3"/><ellipse class="ga" stroke="none" cx="34.5" cy="48" rx="5" ry="4" transform="rotate(-20 34.5 48)"/>',hotel:'<path d="M36 25v-6M30.5 19h11"/><path d="M17 50a19 19 0 0 1 38 0"/><path d="M12 50h48M9 57h54"/><path class="ga-s" d="M25 43a12.5 12.5 0 0 1 6.5-9"/>',insects:'<ellipse cx="36" cy="43" rx="12" ry="15"/><path d="M36 28v30"/><circle cx="36" cy="23.5" r="5"/><path d="M33 19.5l-5-7.5M39 19.5l5-7.5M24 37l-9-4M24 45l-10 2M26 53l-8 7M48 37l9-4M48 45l10 2M46 53l8 7"/><path class="ga-s" d="M36 4v14"/><circle class="ga" stroke="none" cx="36" cy="4.5" r="3"/>'};
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
function diePicture(index,value){const path=index===0?dieGlyphs[value]:formatGlyphs[modes[active].options[value].layout];return `<svg viewBox="0 0 72 72" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${path}</svg>`;}
function dieFaceMarkup(index){return DIE_FACE_VALUES.map((choice,face)=>`<span class="cube-face face-${face}" data-choice="${choice}">${diePicture(index,choice)}<small>${String(choice+1).padStart(2,'0')}</small></span>`).join('');}
// Solid die: six inset faces, twelve 45° bevels and eight corner facets close the cube, so it reads as
// one bevelled object from any angle. Each piece keeps its cube-space normal for lighting.
const DIE_CHAMFER=.075;
const DIE_FACE_NORMALS=[[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,-1,0],[0,1,0]];
const DIE_SOLIDS=(()=>{
 const k=DIE_CHAMFER,r2=Math.SQRT2,deg=180/Math.PI,solids=[];
 const bevel=(transform,normal,long)=>solids.push({kind:'bevel',transform:transform+` translateZ(calc(var(--size)*${((1-k)/r2).toFixed(5)}))`,normal:normal.map(v=>v/Math.hypot(...normal)),w:long==='x'?1-2*k+.012:k*r2*1.12,h:long==='x'?k*r2*1.12:1-2*k+.012});
 bevel('rotateX(45deg)',[0,-1,1],'x');bevel('rotateX(-45deg)',[0,1,1],'x');bevel('rotateY(45deg)',[1,0,1],'y');bevel('rotateY(-45deg)',[-1,0,1],'y');
 bevel('rotateY(180deg) rotateX(45deg)',[0,-1,-1],'x');bevel('rotateY(180deg) rotateX(-45deg)',[0,1,-1],'x');bevel('rotateY(135deg)',[1,0,-1],'y');bevel('rotateY(-135deg)',[-1,0,-1],'y');
 bevel('rotateY(90deg) rotateX(45deg)',[1,-1,0],'x');bevel('rotateY(90deg) rotateX(-45deg)',[1,1,0],'x');bevel('rotateY(-90deg) rotateX(45deg)',[-1,-1,0],'x');bevel('rotateY(-90deg) rotateX(-45deg)',[-1,1,0],'x');
 const h=.5,side=2*(k*r2/Math.sqrt(3))*1.1;
 for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){
  const phi=Math.atan2(sx,sz),theta=-Math.asin(sy/Math.sqrt(3));
  const xl=[Math.cos(phi),0,-Math.sin(phi)],yl=[Math.sin(phi)*Math.sin(theta),Math.cos(theta),Math.cos(phi)*Math.sin(theta)];
  const g=[sx*(h-2*k/3),sy*(h-2*k/3),sz*(h-2*k/3)];
  const points=[[sx*(h-k),sy*(h-k),sz*h],[sx*(h-k),sy*h,sz*(h-k)],[sx*h,sy*(h-k),sz*(h-k)]].map(v=>{const d=v.map((c,i)=>c-g[i]);return [50+(d[0]*xl[0]+d[1]*xl[1]+d[2]*xl[2])/side*100,50+(d[0]*yl[0]+d[1]*yl[1]+d[2]*yl[2])/side*100];});
  solids.push({kind:'corner',transform:`rotateY(${(phi*deg).toFixed(3)}deg) rotateX(${(theta*deg).toFixed(3)}deg) translateZ(calc(var(--size)*${((1.5-2*k)/Math.sqrt(3)).toFixed(5)}))`,normal:[sx,sy,sz].map(v=>v/Math.sqrt(3)),w:side,h:side,clip:'polygon('+points.map(([x,y])=>x.toFixed(2)+'% '+y.toFixed(2)+'%').join(',')+')'});
 }
 return solids;
})();
function dieSolidMarkup(){
 return DIE_SOLIDS.map(({kind,transform,w,h,clip})=>`<span class="cube-${kind}" style="width:calc(var(--size)*${w.toFixed(5)});height:calc(var(--size)*${h.toFixed(5)});margin:calc(var(--size)*${(-h/2).toFixed(5)}) 0 0 calc(var(--size)*${(-w/2).toFixed(5)});transform:${transform}${clip?';clip-path:'+clip:''}"></span>`).join('');
}
// Light from the upper left, in front. Brightness follows each piece's normal through the pose and the
// die's fixed camera, so faces brighten as they turn toward it and bevels catch it at the edges.
const DIE_LIGHT=(()=>{const v=[-.42,-.78,.46],l=Math.hypot(...v);return v.map(c=>c/l);})(),DIE_HALF=(()=>{const v=[-.42,-.78,1.46],l=Math.hypot(...v);return v.map(c=>c/l);})();
const dieShading=[null,null];
function dieCameraMatrix(camera){
 const read=name=>parseFloat(getComputedStyle(camera).getPropertyValue(name))*Math.PI/180||0;
 const [x,y,z]=[read('--view-x'),read('--view-y'),read('--view-z')];
 const mul=(a,b)=>a.map((row,i)=>[0,1,2].map(j=>row[0]*b[0][j]+row[1]*b[1][j]+row[2]*b[2][j]));
 const rx=[[1,0,0],[0,Math.cos(x),-Math.sin(x)],[0,Math.sin(x),Math.cos(x)]],ry=[[Math.cos(y),0,Math.sin(y)],[0,1,0],[-Math.sin(y),0,Math.cos(y)]],rz=[[Math.cos(z),-Math.sin(z),0],[Math.sin(z),Math.cos(z),0],[0,0,1]];
 return mul(mul(rx,ry),rz);
}
function dieBrightness(i,q){
 const shade=dieShading[i];if(!shade)return [];
 return shade.normals.map(normal=>{
  const v=quatRotate(q,normal),m=shade.camera,n=[0,1,2].map(r=>m[r][0]*v[0]+m[r][1]*v[1]+m[r][2]*v[2]);
  const diffuse=Math.max(0,n[0]*DIE_LIGHT[0]+n[1]*DIE_LIGHT[1]+n[2]*DIE_LIGHT[2]),gloss=Math.pow(Math.max(0,n[0]*DIE_HALF[0]+n[1]*DIE_HALF[1]+n[2]*DIE_HALF[2]),28);
  return Math.round((.6+.52*diffuse+.32*gloss)*1000)/1000;
 });
}
function shadeDie(i,q){const shade=dieShading[i];if(!shade)return;dieBrightness(i,q).forEach((b,n)=>{shade.pieces[n].style.filter=`brightness(${b})`;});}
function initDice3D(){
 document.querySelectorAll('.die').forEach((die,i)=>{
  const button=document.createElement('button');button.className='die-object';button.type='button';button.id='throw-'+i;
  button.setAttribute('aria-describedby','dice-gesture-help');
  // A ground plane gives the die a surface to land on; a flat core fills the rounded corners so the cube reads solid.
  button.innerHTML='<span class="die-ground" aria-hidden="true"></span><span class="die-shadow" aria-hidden="true"></span><span class="die-grip" aria-hidden="true"><span class="die-flight"><span class="die-camera"><span class="cube">'+dieSolidMarkup()+dieFaceMarkup(i)+'</span></span></span></span>';
  die.querySelector('.die-top').after(button);bindDieInteraction(button,i);
  const faces=[...button.querySelectorAll('.cube-face')],pieces=[...button.querySelectorAll('.cube-bevel,.cube-corner'),...faces];
  dieShading[i]={pieces,normals:[...DIE_SOLIDS.map(solid=>solid.normal),...faces.map((_,n)=>DIE_FACE_NORMALS[n])],camera:dieCameraMatrix(button.querySelector('.die-camera'))};
 });
 const settle=()=>[0,1].forEach(i=>stopDieMotion(i));
 diceMotion.addEventListener('change',()=>{if(diceMotion.matches)settle();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)stopDieMotion(Number(entry.target.id.slice(-1)));}));
 [0,1].forEach(i=>observer.observe(document.querySelector('#throw-'+i)));
}
function paintDiePose(i,pose){
 $('#throw-'+i+' .cube').style.transform=quatCSS(pose.q);shadeDie(i,pose.q);
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
// The page beside a die, in the die's own coordinates. Beside the page (desktop) a die can reach
// its edge; stacked above it (phone) the change comes from the page's top edge instead.
function dieWall(i,gesture){
 const button=$('#throw-'+i),page=document.querySelector?.('#report-view');
 if(!button?.getBoundingClientRect||!page?.getBoundingClientRect)return null;
 const box=button.getBoundingClientRect(),rect=page.getBoundingClientRect();
 if(!box.width||!rect.width)return null;
 const centre=box.left+box.width/2,middle=box.top+box.height/2;
 const side=rect.left>=centre?'left':rect.right<=centre?'right':'top';
 const wall={side,edge:null,y:middle-rect.top};
 // Only a die resting beside the page, not sliding on or off the table or hidden by a comparison, reaches it.
 const moving=button.getAnimations?.().some(animation=>animation.playState==='running');
 if(side==='top'||moving||document.documentElement?.dataset.comparing==='true'||middle<rect.top+24||middle>rect.bottom-24)return wall;
 const edge=side==='left'?rect.left-centre:rect.right-centre;
 if(Math.abs(edge)>220||(gesture?.direction&&Math.sign(gesture.direction)!==Math.sign(edge)))return wall;
 wall.edge=edge;return wall;
}
// Meet the page edge with the cube's projected width at the moment of the strike.
function dieKnockWall(i,plan){
 if(plan.knock==null)return;
 const camera=dieShading[i]?.camera,q=sampleDiePlan(plan,plan.knock).q,direction=Math.sign(plan.edge);
 const extent=[[1,0,0],[0,1,0],[0,0,1]].reduce((sum,axis)=>{const v=quatRotate(q,axis);return sum+Math.abs(camera?camera[0][0]*v[0]+camera[0][1]*v[1]+camera[0][2]*v[2]:v[0]);},0)*plan.size*.5*1.03;
 plan.wall=plan.edge-direction*extent;
 if((plan.wall-plan.from.x)*direction<0)plan.wall=plan.from.x;
 plan.drift=plan.wall;
}
// A die's pending strike on the page. An interrupted throw still delivers its page change, without
// the shove; a die stopped where it is (hidden page, reduced motion, scrolled away) delivers it whole.
const dieImpacts=[null,null];
function clearDieImpact(i){const pending=dieImpacts[i];if(pending){clearTimeout(pending.timer);dieImpacts[i]=null;pending.land();}}
function flushDieImpact(i){const pending=dieImpacts[i];if(pending){clearTimeout(pending.timer);dieImpacts[i]=null;pending.run();}}
function releaseDieAnimation(i){
 clearDieImpact(i);
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
function stopDieMotion(i){clearDieInvitation(i);resetDieInteraction(i);flushDieImpact(i);finishDie(i);}
function cancelDiceRoll(){activeDiceRoll=null;[0,1].forEach(i=>{clearDieInvitation(i);resetDieInteraction(i);releaseDieAnimation(i);dieStates[i].value=null;});}
function beginDieGrab(i){clearDieInvitation(i);activeDiceRoll=null;return releaseDieAnimation(i);}
function moveDieGrab(i,from,dx,dy=0){
 const size=$('#throw-'+i+' .cube').clientWidth||104;
 dieStates[i].pose=dieGrabPose(from,dx,dy,size);
 paintDiePose(i,dieStates[i].pose);
 const value=dieTopFace(dieStates[i].pose.q);
 const name=i?modes[active].options[value].name:worlds[value].name;
 if(typeof setIngredientLabel==='function')setIngredientLabel(i,name);else $('#ingredient-'+(i?'b':'a')).textContent=name;
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
 const shade=dieShading[i];
 if(shade){const light=times.map(t=>dieBrightness(i,sampleDiePlan(plan,t).q));shade.pieces.forEach((piece,n)=>animations.push(piece.animate(times.map((t,m)=>({offset:t,filter:`brightness(${light[m][n]})`})),options)));}
 // The tray gives under each landing, less with every bounce. `scale` composes with its slant.
 const ground=$('#throw-'+i+' .die-ground');
 if(ground?.animate&&plan.contacts?.length){
  const frames=[{offset:0,scale:'1'}];
  plan.contacts.forEach((contact,n)=>{
   const depth=[.045,.026,.012][n]||0,next=plan.contacts[n+1]??1,dip=Math.min(contact+.014,next),back=Math.min(contact+.085,next);
   frames.push({offset:contact,scale:'1'},{offset:dip,scale:`${1-depth} ${1-depth*1.7}`},{offset:back,scale:'1'});
  });
  frames.push({offset:1,scale:'1'});
  animations.push(ground.animate(frames,options));
 }
 state.running={plan,animations,value};
 animations[0].onfinish=()=>{if(state.running?.animations===animations)finishDie(i);};
}
// impact: the page change this throw causes (from reportImpactFor); it lands when the die reaches the page.
function tumbleDice(indices,values,complete,gesture=null,impact=null){
 // Snapshot the current pose before cancelling: a second throw continues in flight.
 const from=dieStates.map((state,i)=>indices.includes(i)?releaseDieAnimation(i):state.pose);
 // Reroll only the clicked die. Any other die already in flight keeps its motion.
 activeDiceRoll={remaining:new Set([...indices,...[0,1].filter(i=>dieStates[i].running)]),complete};
 if(diceMotion.matches||document.hidden){
  [...activeDiceRoll.remaining].forEach(i=>{releaseDieAnimation(i);dieStates[i].pose={q:dieLanding(values[i]),x:0,y:0};dieStates[i].value=values[i];paintDiePose(i,dieStates[i].pose);});
  activeDiceRoll=null;complete();return;
 }
 const sides=[];
 indices.forEach(i=>{
  clearDieInvitation(i);
  const thrown=Array.isArray(gesture)?gesture[i]:gesture,wall=dieWall(i,thrown);
  const cube=$('#throw-'+i+' .cube'),width=cube.clientWidth||116,travel=Math.max(6,Math.min(20,($('#throw-'+i).clientWidth-width*1.2)/2+8)),plan=makeDiePlan(from[i],values[i],Math.random,width,Number.isFinite(travel)?travel:18,thrown,wall?.edge!=null?wall:null);
  dieKnockWall(i,plan);
  animateDiePlan(i,plan,values[i]);
  if(typeof playDiceClatter==='function')playDiceClatter(i,plan,performance.now());
  // The page reacts when the die strikes its edge, or, out of reach, when the die first lands.
  const side=wall?.side||(i?'right':'left'),knock=plan.knock!=null;
  const hit={side,knock,die:i,strength:dieClamp(thrown?.strength||0),y:knock?wall.y+sampleDiePlan(plan,plan.knock).y:0};
  const run=()=>{if(typeof hitReport==='function')hitReport(impact,hit);},land=()=>{if(typeof landReportImpact==='function')landReportImpact(impact);};
  dieImpacts[i]={run,land,timer:setTimeout(()=>{dieImpacts[i]=null;run();},(knock?plan.knock:plan.contacts[0])*plan.duration)};
  sides.push(side);
  const name=i?modes[active].options[values[i]].name:worlds[values[i]].name;
  $('#throw-'+i).setAttribute('aria-label',`Roll ${i?'second':'first'} die again. ${name}`);
 });
 if(impact&&typeof aimReportImpact==='function')aimReportImpact(impact,sides);
 // A visitor's first roll of a visit lands with a small burst of confetti around the die.
 if(impact?.celebrate){const i=indices[0],landing=dieStates[i].running?.plan;if(landing)setTimeout(()=>celebrateDie(i),landing.contacts[0]*landing.duration);}
}
function celebrateDie(i){
 const button=$('#throw-'+i);
 if(!button?.append||!button.animate||document.hidden||diceMotion.matches)return;
 const burst=document.createElement('span');burst.className='die-burst';burst.setAttribute('aria-hidden','true');
 const colours=['#c2432a','#1d261e','#f2b733','#ff6a3d','#2f8a5b','#3d6fd6'],count=36,pieces=[];
 for(let n=0;n<count;n++){
  const piece=document.createElement('i');piece.className='burst-'+['dot','streak','chip'][n%3];piece.style.background=colours[n%colours.length];
  burst.append(piece);pieces.push(piece);
 }
 button.append(burst);
 pieces.forEach((piece,n)=>{
  const angle=n/count*Math.PI*2+Math.random()*.35,distance=90+Math.random()*100,x=Math.cos(angle)*distance,y=Math.sin(angle)*distance*.75-18,spin=(Math.random()-.5)*6;
  piece.animate([
   {transform:`translate(-50%,-50%) rotate(${angle}rad) scale(.3)`,opacity:1},
   {transform:`translate(calc(-50% + ${x*.78}px),calc(-50% + ${y*.78}px)) rotate(${angle+spin*.5}rad) scale(1)`,opacity:1,offset:.42},
   {transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y+42}px)) rotate(${angle+spin}rad) scale(.6)`,opacity:0}
  ],{duration:760+Math.random()*460,delay:(n%4)*14,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
 });
 setTimeout(()=>burst.remove(),1500);
 if(typeof playCelebration==='function')playCelebration(i);
}
