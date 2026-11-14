// Die glyphs: one recognisable silhouette per ingredient in the face ink, with one or two identifying
// details and one accent: Cthulhu's eyes, the helmet plume, the sun, the stamp mark, the flag tip, the lure;
// the chip core, the glinting tiles, the patty, the masks' features, the ding, the specimen pin.
const dieGlyphs=[
 "<path stroke-width=\"3\" d=\"M25 27C21 21.5 16 16 10.5 13c.3 4.8 0 9-.8 13 3.8-.8 7 2 7.8 5.8 3-1 6 .5 8 3M47 27c4-5.5 9-11 14.5-14-.3 4.8 0 9 .8 13-3.8-.8-7 2-7.8 5.8-3-1-6 .5-8 3\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M25.5 41C22 31 24 13 36 13s14 18 10.5 28Z\"/><path class=\"ga\" stroke=\"none\" d=\"M27.5 28.5l6.5 2.5-1.5 3.5c-3 0-4.5-2.5-5-6ZM44.5 28.5l-6.5 2.5 1.5 3.5c3 0 4.5-2.5 5-6Z\"/><path d=\"M27.5 40c-2 7-9 8-9.5 14-.3 4 4.5 5 5.5 1.5M33 41c0 6-4 10-3 16 .5 3 3.5 3.5 4 1M39 41c0 6 4 10 3 16-.5 3-3.5 3.5-4 1M44.5 40c2 7 9 8 9.5 14 .3 4-4.5 5-5.5 1.5\"/>",
 "<path class=\"ga\" stroke=\"none\" d=\"M50 22C47.5 13 39.5 8.5 30 9 20.5 9.5 13 16.5 12 26.5c-.4 4 .3 8 2 11.5 1-7.5 5-14 11-16.5 8.5-3.5 17-2 25 .5Z\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M31.5 26.5l2-6.5h8.5l2 6.5ZM16 59.5c3.5-4 4.5-8.5 4-13.5C19 33 27 25 37 25s17 6 18.5 14l-11 3.5 12 3.5-1.5 9-5 7c-4-6.5-9-11.5-14.5-11-5.5.5-8.5 4-10 9-3-.5-6.5-.5-9.5-.5Z\"/>",
 "<path class=\"ga\" stroke=\"none\" d=\"M37.8 21.8A9 9 0 1 1 49.3 32.5A16.1 16.1 0 0 0 37.8 21.8Z\"/><path class=\"ga-s\" stroke-width=\"3\" d=\"M51.3 12.4L52.5 9.6M58.1 19.2L60.9 18M58.1 28.8L60.9 30M34.9 19.2L32.1 18M41.7 12.4L40.5 9.6\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M22.5 52A8 8 0 0 1 21.6 36.1A12.5 12.5 0 0 1 46.4 36.2A8 8 0 0 1 48 52Z\"/><path d=\"M23 56.5l-2.5 5M33.5 56.5l-2.5 5M44 56.5l-2.5 5\"/>",
 "<path d=\"M12 20.5a3 3 0 0 1 3-3h16l9 9V59a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3Z\"/><path stroke-width=\"2.6\" d=\"M31 17.5v9h9M18 30h8M18 37h11.5\"/><g transform=\"rotate(-9 25 49)\"><rect class=\"ga-s\" stroke-width=\"2.6\" x=\"17.5\" y=\"44\" width=\"15\" height=\"10\" rx=\"2\"/><path class=\"ga-s\" stroke-width=\"2.4\" d=\"M21.5 49h7\"/></g><g transform=\"translate(46 42) rotate(16)\"><circle cx=\"0\" cy=\"-27\" r=\"5\"/><path d=\"M-4.5-13-3-22h6l1.5 9\"/><rect fill=\"currentColor\" stroke=\"none\" x=\"-12.5\" y=\"-14\" width=\"25\" height=\"14\" rx=\"2.5\"/></g>",
 "<path d=\"M18 62V13\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M18 14Q23.1 15.1 28.3 16L28.3 24.7Q23.1 23.8 18 22.7ZM38.5 15.7Q43.6 14.2 48.8 11.9L48.8 20.6Q43.6 22.9 38.5 24.3ZM28.3 24.7Q33.4 25.6 38.5 24.3L38.5 33Q33.4 34.2 28.3 33.4ZM48.8 20.6Q53.9 18.4 59 18.7L59 27.3Q53.9 27 48.8 29.3ZM18 31.3Q23.1 32.4 28.3 33.4L28.3 42Q23.1 41.1 18 40ZM38.5 33Q43.6 31.5 48.8 29.3L48.8 37.9Q43.6 40.2 38.5 41.7Z\"/><path stroke-width=\"3\" d=\"M18 14Q23.1 15.1 28.3 16Q33.4 16.9 38.5 15.7Q43.6 14.2 48.8 11.9Q53.9 9.7 59 10L59 36Q53.9 35.7 48.8 37.9Q43.6 40.2 38.5 41.7Q33.4 42.9 28.3 42Q23.1 41.1 18 40\"/><circle class=\"ga\" stroke=\"none\" cx=\"18\" cy=\"11.6\" r=\"3.4\"/>",
 "<path d=\"M16 33C21 27 30 24 39 25c9 1 15 7 16.5 14L62 33c-1.5 6.5-1.5 12.5 0 18.5L55.5 46C53 54.5 44 59 33 59c-10 0-17.5-3.5-22-8.5L29 43.5Z\"/><path stroke-width=\"2.2\" d=\"M18.1 34.7L17.3 39.4L21.7 37.6M22.3 38.1L21.4 42.8L25.8 41M12.5 49.9L13.1 45.2L16.7 48.3M17.5 48L18.1 43.2L21.8 46.3\"/><circle fill=\"currentColor\" stroke=\"none\" cx=\"34\" cy=\"33\" r=\"2.6\"/><path stroke-width=\"2.6\" d=\"M41 45c3 1.5 5 4 5.5 7.5\"/><path stroke-width=\"2.6\" d=\"M31 25.5C30 16.5 26 11.5 21.5 11.5c-3 0-5 2-5.5 5\"/><circle class=\"ga\" stroke=\"none\" cx=\"16\" cy=\"20\" r=\"4\"/><circle class=\"ga-s\" cx=\"16\" cy=\"20\" r=\"7\" opacity=\".45\" stroke-width=\"2\"/>"
];
const formatGlyphs={tech:"<rect x=\"23\" y=\"23\" width=\"26\" height=\"26\" rx=\"3.5\"/><rect class=\"ga\" stroke=\"none\" x=\"30\" y=\"30\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M29.5 17v6M42.5 17v6M29.5 49v6M42.5 49v6M17 29.5h6M17 42.5h6M49 29.5h6M49 42.5h6\"/><path stroke-width=\"3\" d=\"M36 23v-9M36 49v9M23 36h-9M49 36h9\"/><circle fill=\"currentColor\" stroke=\"none\" cx=\"36\" cy=\"11.5\" r=\"3.4\"/><circle fill=\"currentColor\" stroke=\"none\" cx=\"36\" cy=\"60.5\" r=\"3.4\"/><circle fill=\"currentColor\" stroke=\"none\" cx=\"11.5\" cy=\"36\" r=\"3.4\"/><circle fill=\"currentColor\" stroke=\"none\" cx=\"60.5\" cy=\"36\" r=\"3.4\"/>",disco:"<path d=\"M36 10v10\"/><circle fill=\"currentColor\" stroke=\"none\" cx=\"36\" cy=\"40\" r=\"20\"/><path class=\"ga\" stroke=\"none\" d=\"M36 26.5L36 28.8L36 31L36 33.3L45.4 33.3L44.9 31L44.3 28.8L43.4 26.5ZM45.4 33.3L45.7 35.5L45.9 37.8L46 40L53.3 40L53.2 37.8L52.9 35.5L52.3 33.3ZM26 40L26.1 42.3L26.3 44.5L26.6 46.8L36 46.8L36 44.5L36 42.3L36 40ZM36 46.8L36 49L36 51.3L36 53.5L43.4 53.5L44.3 51.3L44.9 49L45.4 46.8ZM19.7 33.3L19.1 35.5L18.8 37.8L18.7 40L26 40L26.1 37.8L26.3 35.5L26.6 33.3ZM53.3 40L53.2 42.3L52.9 44.5L52.3 46.8L54.8 46.8L55.5 44.5L55.9 42.3L56 40ZM17.2 46.8L18.1 49L19.5 51.3L21.2 53.5L23.2 53.5L21.7 51.3L20.5 49L19.7 46.8ZM48.8 26.5L50.3 28.8L51.5 31L52.3 33.3L54.8 33.3L53.9 31L52.5 28.8L50.8 26.5ZM36 20L31.5 22.2L29.8 24.3L28.6 26.5L36 26.5L36 24.3L36 22.2L36 20ZM43.4 53.5L42.2 55.7L40.5 57.8L36 60L36 60L43.8 57.8L46.8 55.7L48.8 53.5Z\"/><path class=\"ga-s\" stroke-width=\"2\" stroke-linecap=\"butt\" d=\"M22.4 26.5H49.6M17.8 33.3H54.2M16.2 40H55.8M17.8 46.8H54.2M22.4 53.5H49.6M36 20.6A17.3 19.4 0 0 0 36 59.4M36 20.6A10 19.4 0 0 0 36 59.4M36 20.6V59.4M36 20.6A10 19.4 0 0 1 36 59.4M36 20.6A17.3 19.4 0 0 1 36 59.4\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M57.5 12Q58.6 16.9 63.5 18Q58.6 19.1 57.5 24Q56.4 19.1 51.5 18Q56.4 16.9 57.5 12ZM13.5 21.5Q14.3 25.2 18 26Q14.3 26.8 13.5 30.5Q12.7 26.8 9 26Q12.7 25.2 13.5 21.5ZM59.5 51.4Q60.1 54.4 63.1 55Q60.1 55.6 59.5 58.6Q58.9 55.6 55.9 55Q58.9 54.4 59.5 51.4Z\"/>",diner:"<path d=\"M14 32c0-11 9.5-18 22-18s22 7 22 18Z\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M27 21.5l2.5-1.5.5 2-2.5 1ZM36 19l2.5.5-.5 2-2.5-.5ZM44 23l2.2 1.6-1.4 1.4-2-1.6ZM31.5 27l2.5-.8.4 2-2.6.6Z\"/><path stroke-width=\"3\" d=\"M12 37.5c2.5-2.5 5 2.5 7.5 0s5 2.5 7.5 0 5 2.5 7.5 0 5 2.5 7.5 0 5 2.5 7.5 0 5 2.5 7.5 0\"/><rect class=\"ga\" stroke=\"none\" x=\"13\" y=\"42\" width=\"46\" height=\"9\" rx=\"4.5\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M18 41h36l-6 4.5-4-3-5 6-4.5-6-7 5.5-3-5.5-4 3Z\"/><path d=\"M15 55h42v1a6 6 0 0 1-6 6H21a6 6 0 0 1-6-6Z\"/>",opera:"<g transform=\"translate(24 37.5) rotate(-13) scale(1.04 1.16)\"><path fill=\"currentColor\" stroke=\"none\" d=\"M-11.5-12.5C-5-15.5 5-15.5 11.5-12.5 13-1.5 9 9 0 14.5-9 9-13-1.5-11.5-12.5Z\"/><path class=\"ga\" stroke=\"none\" d=\"M-8 -4.5c1.5-3 5-3 6.5 0-1.8-1-4.7-1-6.5 0ZM1.5 -4.5c1.5-3 5-3 6.5 0-1.8-1-4.7-1-6.5 0ZM-6.5 2.5c3.5 5.5 9.5 5.5 13 0-4 1.5-9 1.5-13 0Z\"/></g><g transform=\"translate(48 37.5) rotate(13) scale(1.04 1.16)\"><path fill=\"currentColor\" stroke=\"none\" d=\"M-11.5-12.5C-5-15.5 5-15.5 11.5-12.5 13-1.5 9 9 0 14.5-9 9-13-1.5-11.5-12.5Z\"/><path class=\"ga\" stroke=\"none\" d=\"M-8 -6c2.5 1 5 2.5 6.5 4.5-2.5.5-5.5-1-6.5-4.5ZM8 -6c-2.5 1-5 2.5-6.5 4.5 2.5.5 5.5-1 6.5-4.5ZM-6 8.5c3.5-5 8.5-5 12 0-4-2-8-2-12 0Z\"/></g>",hotel:"<path class=\"ga-s\" stroke-width=\"3\" d=\"M17.5 21l-4-4M54.5 21l4-4M15 29.5H10M57 29.5h5\"/><path d=\"M36 30v-6\"/><rect fill=\"currentColor\" stroke=\"none\" x=\"30\" y=\"19\" width=\"12\" height=\"4.5\" rx=\"2\"/><path d=\"M17 47.5a19 19 0 0 1 38 0Z\"/><path stroke-width=\"2.6\" d=\"M24.5 41a12 12 0 0 1 6-7.5\"/><rect fill=\"currentColor\" stroke=\"none\" x=\"11\" y=\"51.5\" width=\"50\" height=\"9.5\" rx=\"2.5\"/>",insects:"<rect stroke-width=\"3\" x=\"11\" y=\"10\" width=\"50\" height=\"52\" rx=\"3\"/><g stroke-width=\"4\" transform=\"translate(36 28.5) scale(.8) translate(-36 -29)\"><path d=\"M34 25c-4-6-11-10.5-20-11 .5 7 2.5 13.5 7 16.5 3.5 2 8.5 2 13 .5M38 25c4-6 11-10.5 20-11-.5 7-2.5 13.5-7 16.5-3.5 2-8.5 2-13 .5M34 33.5c-5 0-11 2-12.5 6.5-1 3.5 2 6 5.5 5 3.5-1 6-5 7-8.5M38 33.5c5 0 11 2 12.5 6.5 1 3.5-2 6-5.5 5-3.5-1-6-5-7-8.5\"/><rect fill=\"currentColor\" stroke=\"none\" x=\"33\" y=\"19\" width=\"6\" height=\"25\" rx=\"3\"/><path stroke-width=\"3.2\" d=\"M34.5 19.5c-1-3.5-3-6-5.5-7.5M37.5 19.5c1-3.5 3-6 5.5-7.5\"/><circle class=\"ga\" stroke=\"none\" cx=\"36\" cy=\"25.5\" r=\"3.2\"/></g><rect stroke-width=\"2.6\" x=\"27.5\" y=\"49.5\" width=\"17\" height=\"6.5\" rx=\"1\"/>"};
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
  // The floor shares the die's camera, so the die lands on it; the die moves in the same space above it.
  button.innerHTML='<span class="die-floor" aria-hidden="true"><span class="die-ground"></span><span class="die-shadow"></span></span><span class="die-grip" aria-hidden="true"><span class="die-camera"><span class="die-flight"><span class="cube">'+dieSolidMarkup()+dieFaceMarkup(i)+'</span></span></span></span>';
  die.querySelector('.die-top').after(button);bindDieInteraction(button,i);
  const faces=[...button.querySelectorAll('.cube-face')],pieces=[...button.querySelectorAll('.cube-bevel,.cube-corner'),...faces];
  dieShading[i]={pieces,normals:[...DIE_SOLIDS.map(solid=>solid.normal),...faces.map((_,n)=>DIE_FACE_NORMALS[n])],camera:dieCameraMatrix(button.querySelector('.die-camera'))};
 });
 const settle=()=>[0,1].forEach(i=>stopDieMotion(i));
 diceMotion.addEventListener('change',()=>{if(diceMotion.matches)settle();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
 // A die scrolled out of view stops where it is. One sliding on or off the table is only off-screen on its
 // way: it keeps its tumble, so a die thrown in arrives still rolling.
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const i=Number(entry.target.id.slice(-1));
  if(entry.isIntersecting)prepareThrows(i);
  else if(!entry.target.getAnimations?.().some(animation=>animation.playState==='running'))stopDieMotion(i);
 }));
 [0,1].forEach(i=>observer.observe(document.querySelector('#throw-'+i)));
}
// The contact shadow on the floor: tight and dark on the tray, wider and fainter as the die rises.
function dieShadowFrame(pose,size){const height=Math.min(1,(pose.air??Math.max(0,-pose.y))/(size*.6));return {transform:`translateX(${pose.x}px) scale(${1+height*.25})`,opacity:1-height*.72};}
function paintDiePose(i,pose){
 const cube=$('#throw-'+i+' .cube');cube.style.transform=quatCSS(pose.q);shadeDie(i,pose.q);
 $('#throw-'+i+' .die-flight').style.transform=`translate3d(${pose.x}px,${pose.y}px,0)`;
 const shadow=$('#throw-'+i+' .die-shadow'),frame=dieShadowFrame(pose,cube.clientWidth||116);
 shadow.style.transform=frame.transform;shadow.style.opacity=String(frame.opacity);
}
function syncDice3D(){
 [a,b].forEach((value,i)=>{
  const button=$('#throw-'+i),state=dieStates[i],name=i?modes[active].options[value].name:worlds[value].name;
  button.setAttribute('aria-label',typeof introMode!=='undefined'&&introMode?`Pick up and throw the ${i?'second':'first'} die`:`Roll ${i?'second':'first'} die${state.running?' again':''}. ${name}`);
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
 if(Math.abs(edge)>220||(gesture?.direction&&!gesture.guided&&Math.sign(gesture.direction)!==Math.sign(edge)))return wall;
 wall.edge=edge;return wall;
}
// Meet the page edge with the cube's projected width at the moment of the strike.
function dieKnockWall(i,plan){
 if(plan.knock==null||plan.kind==='physics')return;
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
 prepareThrows(i);
}
function stopDieMotion(i){clearDieInvitation(i);resetDieInteraction(i);flushDieImpact(i);finishDie(i);}
function cancelDiceRoll(){activeDiceRoll=null;[0,1].forEach(i=>{clearDieInvitation(i);resetDieInteraction(i);releaseDieAnimation(i);dieStates[i].value=null;});}
// Picking a die up: where the page sits is read once, so carrying it never reads layout per move.
function beginDieGrab(i){clearDieInvitation(i);activeDiceRoll=null;const pose=releaseDieAnimation(i);dieStates[i].hold={wall:dieWall(i,null)?.edge??null};return pose;}
function moveDieGrab(i,from,dx,dy=0){
 const size=$('#throw-'+i+' .cube').clientWidth||104;
 dieStates[i].pose=dieHoldPose(from,dx,dy,size,{wall:dieStates[i].hold?.wall??null,camera:dieShading[i]?.camera||null});
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
 // A simulated throw is sampled at 120 frames a second; exact contact times keep each impact sharp.
 const regular=plan.kind==='physics'?plan.frames.map(frame=>frame.t):Array.from({length:67},(_,n)=>n/66);
 const times=[...new Set([...regular,...plan.contacts])].sort((x,y)=>x-y);
 const rotation=[],flight=[],shadow=[],poses=times.map(t=>sampleDiePlan(plan,t)),size=plan.size||116;
 poses.forEach((pose,n)=>{const offset=times[n];rotation.push({offset,transform:quatCSS(pose.q)});flight.push({offset,transform:`translate3d(${pose.x}px,${pose.y}px,0)`});shadow.push({offset,...dieShadowFrame(pose,size)});});
 const options={duration:plan.duration,easing:'linear',fill:'forwards'};
 const animations=[$('#throw-'+i+' .cube').animate(rotation,options),$('#throw-'+i+' .die-flight').animate(flight,options),$('#throw-'+i+' .die-shadow').animate(shadow,options)];
 // Light changes slowly next to the motion, so 30 samples a second carry it; every piece keeps its own.
 const shade=dieShading[i];
 if(shade){const lit=times.filter((t,n)=>n===0||t===1||n%4===0),light=lit.map(t=>dieBrightness(i,sampleDiePlan(plan,t).q));shade.pieces.forEach((piece,n)=>animations.push(piece.animate(lit.map((t,m)=>({offset:t,filter:`brightness(${light[m][n]})`})),options)));}
 // The tray gives under each landing, less with every bounce. `scale` composes with its slant.
 const ground=$('#throw-'+i+' .die-ground');
 if(ground?.animate&&plan.contacts?.length){
  const frames=[{offset:0,scale:'1'}];
  plan.contacts.forEach((contact,n)=>{
   const depth=.045*(plan.levels?.[n]??.58**n),next=plan.contacts[n+1]??1,dip=Math.min(contact+.014,next),back=Math.min(contact+.085,next);
   frames.push({offset:contact,scale:'1'},{offset:dip,scale:`${1-depth} ${1-depth*1.7}`},{offset:back,scale:'1'});
  });
  frames.push({offset:1,scale:'1'});
  animations.push(ground.animate(frames,options));
 }
 state.running={plan,animations,value};
 animations[0].onfinish=()=>{if(state.running?.animations===animations)finishDie(i);};
}
// The next click's throws are worked out while the page is idle, one face at a time, so a click only has to
// start the animation. A plan is used only if nothing it depends on has changed since.
const preparedThrows=[new Map(),new Map()],preparing=[null,null];
// The scripted hop is for a click that cannot wait. Idle time can: a face whose search ran out of time is
// tried again on later idle slices, and the hop is kept only when the simulation keeps missing.
const THROW_RETRIES=4,throwMisses=[{key:'',counts:new Map()},{key:'',counts:new Map()}];
function throwKey(from,wall,size,travel,gesture){return JSON.stringify([from.q.map(c=>+c.toFixed(5)),+from.x.toFixed(2),+from.y.toFixed(2),wall,size,travel,gesture?{d:gesture.direction,s:gesture.strength}:null]);}
function throwSetup(i,gesture){
 const wall=dieWall(i,gesture),cube=$('#throw-'+i+' .cube'),width=cube.clientWidth||116,travel=Math.max(6,Math.min(20,($('#throw-'+i).clientWidth-width*1.2)/2+8));
 return {wall,width,travel:Number.isFinite(travel)?travel:18};
}
function prepareThrows(i){
 if(typeof requestIdleCallback!=='function'||preparing[i]||diceMotion.matches)return;
 const step=deadline=>{
  preparing[i]=null;const state=dieStates[i];
  if(state.running||document.hidden||view!=='dice')return;
  // On the plain page each die is thrown by the visitor from rest, at the page beside it.
  const gesture=typeof introMode!=='undefined'&&introMode&&typeof DICE_THROW!=='undefined'?(i?DICE_THROW.enter[1]:DICE_THROW.first):null;
  const {wall,width,travel}=throwSetup(i,gesture),edge=wall?.edge??null,key=throwKey(state.pose,edge,width,travel,gesture);
  const misses=throwMisses[i];if(misses.key!==key){misses.key=key;misses.counts.clear();}
  for(const value of DIE_FACE_VALUES){
   if(preparedThrows[i].has(value))continue;
   if(deadline.timeRemaining()<6){preparing[i]=requestIdleCallback(step,{timeout:2000});return;}
   const plan=makeDiePlan(state.pose,value,Math.random,width,travel,gesture,edge!=null?wall:null,dieShading[i]?.camera||null);
   if(plan.kind!=='physics'){
    const missed=(misses.counts.get(value)||0)+1;misses.counts.set(value,missed);
    if(missed<THROW_RETRIES){preparing[i]=requestIdleCallback(step,{timeout:2000});return;}
   }
   preparedThrows[i].set(value,{key,plan});
  }
 };
 preparing[i]=requestIdleCallback(step,{timeout:2000});
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
 // Read every die's place against the page before any of them starts moving.
 const setups=new Map(indices.map(i=>[i,throwSetup(i,Array.isArray(gesture)?gesture[i]:gesture)]));
 indices.forEach(i=>{
  clearDieInvitation(i);
  const thrown=Array.isArray(gesture)?gesture[i]:gesture,{wall,width,travel}=setups.get(i),edge=wall?.edge??null;
  const ready=!thrown?.velocity?preparedThrows[i].get(values[i]):null;
  const plan=ready&&ready.key===throwKey(from[i],edge,width,travel,thrown)?ready.plan:makeDiePlan(from[i],values[i],Math.random,width,travel,thrown,edge!=null?wall:null,dieShading[i]?.camera||null);
  preparedThrows[i].clear();
  dieKnockWall(i,plan);
  animateDiePlan(i,plan,values[i]);
  if(typeof playDiceClatter==='function')playDiceClatter(i,plan,performance.now());
  // The page reacts when the die strikes its edge, or, out of reach, when the die first lands.
  const side=wall?.side||(i?'right':'left'),knock=plan.knock!=null;
  const hit={side,knock,die:i,strength:dieClamp(thrown?.strength||0),y:knock?wall.y+(plan.strikeY??sampleDiePlan(plan,plan.knock).y):0};
  const run=()=>{if(typeof hitReport==='function')hitReport(impact,hit);},land=()=>{if(typeof landReportImpact==='function')landReportImpact(impact);};
  dieImpacts[i]={run,land,timer:setTimeout(()=>{dieImpacts[i]=null;run();},(knock?plan.knock:plan.contacts[0])*plan.duration)};
  sides.push({side,knock});
  const name=i?modes[active].options[values[i]].name:worlds[values[i]].name;
  $('#throw-'+i).setAttribute('aria-label',`Roll ${i?'second':'first'} die again. ${name}`);
 });
 // The page changes from the edges that were struck; with no strike, from where the dice landed.
 const struck=sides.filter(hit=>hit.knock).map(hit=>hit.side);
 if(impact&&typeof aimReportImpact==='function')aimReportImpact(impact,struck.length?struck:sides.map(hit=>hit.side));
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
