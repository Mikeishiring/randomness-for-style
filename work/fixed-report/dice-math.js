// All six ingredients are permanently attached to their local cube normals.
const DIE_FACE_VALUES=Object.freeze([0,1,2,3,4,5]);
const DIE_NORMALS=Object.freeze([[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,-1,0],[0,1,0]]);
const dieClamp=n=>Math.max(0,Math.min(1,n));
function quatUnit(q){const length=Math.hypot(...q);return q.map(v=>v/length);}
function quatAxis(axis,angle){const length=Math.hypot(...axis),s=Math.sin(angle/2)/length;return [axis[0]*s,axis[1]*s,axis[2]*s,Math.cos(angle/2)];}
function quatMultiply(a,b){const [x,y,z,w]=a,[X,Y,Z,W]=b;return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z];}
function quatSlerp(a,b,t){
 let dot=a.reduce((sum,v,i)=>sum+v*b[i],0),end=b;
 if(dot<0){dot=-dot;end=b.map(v=>-v);}
 if(dot>.9995)return quatUnit(a.map((v,i)=>v+(end[i]-v)*t));
 const theta=Math.acos(Math.min(1,dot)),s=Math.sin(theta),startWeight=Math.sin((1-t)*theta)/s,endWeight=Math.sin(t*theta)/s;
 return a.map((v,i)=>v*startWeight+end[i]*endWeight);
}
function quatRotate(q,v){const rotated=quatMultiply(quatMultiply(q,[...v,0]),[-q[0],-q[1],-q[2],q[3]]);return rotated.slice(0,3);}
function quatCSS(q){
 const [x,y,z,w]=quatUnit(q),xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
 return 'matrix3d('+[1-2*(yy+zz),2*(xy+wz),2*(xz-wy),0,2*(xy-wz),1-2*(xx+zz),2*(yz+wx),0,2*(xz+wy),2*(yz-wx),1-2*(xx+yy),0,0,0,0,1].map(n=>Math.abs(n)<1e-9?0:Number(n.toFixed(9))).join(',')+')';
}
function dieLanding(value,yaw=0){
 const normal=DIE_NORMALS[value],up=[0,-1,0],dot=-normal[1];
 const axis=[normal[1]*up[2]-normal[2]*up[1],normal[2]*up[0]-normal[0]*up[2],normal[0]*up[1]-normal[1]*up[0]];
 const level=dot>.999?[0,0,0,1]:dot<-.999?quatAxis([1,0,0],Math.PI):quatAxis(axis,Math.acos(dot));
 return quatMultiply(quatAxis([0,1,0],yaw),level);
}
function dieTopFace(q){
 return DIE_NORMALS.reduce((best,normal,index)=>-quatRotate(q,normal)[1]>-quatRotate(q,DIE_NORMALS[best])[1]?index:best,0);
}
// Level the chosen face without discarding the yaw the visitor gave it.
function dieSnap(q,value=dieTopFace(q)){
 const normal=quatRotate(q,DIE_NORMALS[value]),dot=Math.max(-1,Math.min(1,-normal[1]));
 const align=dot>=1||Math.hypot(normal[0],normal[2])<1e-12?[0,0,0,1]:dot<-.999999?quatAxis([1,0,0],Math.PI):quatAxis([normal[2],0,-normal[0]],Math.acos(dot));
 return quatUnit(quatMultiply(align,q));
}
function dieGrabPose(from,dx,dy,size=94){
 const angle=Math.hypot(dx,dy)*Math.PI/(size*2);
 const rotation=angle?quatAxis([-dy,0,dx],angle):[0,0,0,1];
 const q=quatUnit(quatMultiply(rotation,from.q));
 const air=Math.max(0,-from.y-dieSupportLift(from.q,size));
 return {q,x:Math.max(-16,Math.min(16,from.x+10*Math.tanh(dx/90))),y:-air-dieSupportLift(q,size),air};
}
// The bevelled cube's outline for contact: the 24 corners of its six inset faces, in units of its size.
const DIE_HULL=(()=>{const out=[];for(let axis=0;axis<3;axis++)for(const s of [-1,1])for(const u of [-1,1])for(const v of [-1,1]){const p=[0,0,0];p[axis]=s*.5;p[(axis+1)%3]=u*.425;p[(axis+2)%3]=v*.425;out.push(p);}return out;})();
function quatMatrix(q){const [x,y,z,w]=q;return [1-2*(y*y+z*z),2*(x*y-w*z),2*(x*z+w*y),2*(x*y+w*z),1-2*(x*x+z*z),2*(y*z-w*x),2*(x*z-w*y),2*(y*z+w*x),1-2*(x*x+y*y)];}
// How far the die's centre must rise for its lowest point to rest on the tray.
// Held in the hand: lifted off the tray as the drag begins, carried with the pointer and turned as it
// goes. Dragging up lifts it higher. It never reaches into the page beside it (wall: the page edge's
// distance from home on screen; camera: the die's view, to convert screen to world).
function dieHoldPose(from,dx,dy,size=94,{wall=null,camera=null}={}){
 const turned=dieGrabPose(from,dx,dy,size),rise=Math.min(1,Math.hypot(dx,dy)/40),eased=rise*rise*(3-2*rise);
 const before=Math.max(0,-from.y-dieSupportLift(from.q,size));
 const height=Math.max(before*(1-eased),eased*Math.max(size*.2,Math.min(size*1.1,size*.55-dy*1.4)));
 const across=camera?Math.max(.5,Math.abs(camera[0][0])):1;
 let x=Math.max(-size*1.2,Math.min(size*1.2,from.x+dx/across));
 if(wall!=null){const side=Math.sign(wall),limit=(Math.abs(wall)-size*.9)/across;if(side*x>limit)x=side*Math.max(0,limit);}
 return {q:turned.q,x,y:-height-dieSupportLift(turned.q,size),air:height};
}
function dieSupportLift(q,size=116){
 const M=quatMatrix(q);let low=-Infinity;
 for(const c of DIE_HULL){const y=M[3]*c[0]+M[4]*c[1]+M[5]*c[2];if(y>low)low=y;}
 return Math.max(0,(low-.5)*size);
}
// A rigid bevelled cube thrown onto a flat tray: gravity, corner impacts with restitution and friction,
// a gentle pull back toward the die's home, and, if given, the page edge as a wall across the screen's
// x axis. px and seconds; y points down; the tray is the plane size/2 below the die's resting centre.
function simulateDieThrow({from,size,velocity,spin,wall=null,limit=2.6,friction=.55}){
 const s=size,g=30*s,dt=1/240,Iinv=6/(s*s),home=90,e=.42,mu=friction,slow=.18*Math.sqrt(g*s),mark=.07*Math.sqrt(g*s);
 let px=from.x,py=from.y,vx=velocity[0],vy=velocity[1],vz=0,wx=spin[0],wy=spin[1],wz=spin[2],q=[...from.q];
 const frames=[{t:0,q:[...q],x:px,y:py}],contacts=[],list=[];let knock=null,still=0,t=0;
 for(let step=1;step<=Math.round(limit/dt);step++){
  t=step*dt;vy+=g*dt;px+=vx*dt;py+=vy*dt;
  {const [x,y,z,w]=q,h=.5*dt;q=[x+h*(wx*w+wy*z-wz*y),y+h*(wy*w+wz*x-wx*z),z+h*(wz*w+wx*y-wy*x),w-h*(wx*x+wy*y+wz*z)];const l=Math.hypot(...q);q=q.map(c=>c/l);}
  list.length=0;let deep=0,wallDeep=0,touching=false;
  // Clear of the tray and the page by more than the die's half-diagonal, no corner can touch either.
  const clear=py+s*.87<s/2&&(!wall||wall.dir*(wall.axis[0]*px+wall.axis[1]*py-wall.edge)<-s*.87);
  const M=clear?null:quatMatrix(q);
  if(!clear)for(const c of DIE_HULL){
   const rx=(M[0]*c[0]+M[1]*c[1]+M[2]*c[2])*s,ry=(M[3]*c[0]+M[4]*c[1]+M[5]*c[2])*s,rz=(M[6]*c[0]+M[7]*c[1]+M[8]*c[2])*s,X=px+rx,Y=py+ry;
   const pen=Y-s/2;
   // Leaving the hand, a spinning corner would brush the tray: the die is lifted clear of it, and the
   // throw only meets the tray on the way down.
   if(pen>0){if(pen>deep)deep=pen;if(!(t<.05&&vy<0)){touching=true;list.push([rx,ry,rz,0,-1,0,e,mu,0]);}}
   if(wall){const over=wall.dir*(wall.axis[0]*X+wall.axis[1]*Y+wall.axis[2]*rz-wall.edge);if(over>0){list.push([rx,ry,rz,-wall.dir*wall.axis[0],-wall.dir*wall.axis[1],-wall.dir*wall.axis[2],.8,.2,1]);if(over>wallDeep)wallDeep=over;}}
  }
  // Several passes over every touching corner share the impulse between them, so a die resting on a
  // face sits still instead of chattering; only the first pass bounces.
  let impulse=0;
  for(let pass=0;pass<6&&list.length;pass++)for(const k of list){
   const [rx,ry,rz,nx,ny,nz,rest,fr,isWall]=k;
   const ux=vx+wy*rz-wz*ry,uy=vy+wz*rx-wx*rz,uz=vz+wx*ry-wy*rx,vn=ux*nx+uy*ny+uz*nz;if(vn>=0)continue;
   const cx=ry*nz-rz*ny,cy=rz*nx-rx*nz,cz=rx*ny-ry*nx,kn=1+Iinv*(cx*cx+cy*cy+cz*cz),bounce=pass===0&&-vn>slow?rest:0,jn=-(1+bounce)*vn/kn;
   vx+=nx*jn;vy+=ny*jn;vz+=nz*jn;wx+=Iinv*cx*jn;wy+=Iinv*cy*jn;wz+=Iinv*cz*jn;
   if(isWall){if(knock===null)knock=t;}else if(pass===0)impulse+=jn;
   const ax=vx+wy*rz-wz*ry,ay=vy+wz*rx-wx*rz,az=vz+wx*ry-wy*rx,an=ax*nx+ay*ny+az*nz,tx=ax-an*nx,ty=ay-an*ny,tz=az-an*nz,speed=Math.hypot(tx,ty,tz);
   if(speed>1e-6){const dx=tx/speed,dy=ty/speed,dz=tz/speed,ex=ry*dz-rz*dy,ey=rz*dx-rx*dz,ez=rx*dy-ry*dx,kt=1+Iinv*(ex*ex+ey*ey+ez*ez),jt=Math.min(speed/kt,fr*jn);vx-=dx*jt;vy-=dy*jt;vz-=dz*jt;wx-=Iinv*ex*jt;wy-=Iinv*ey*jt;wz-=Iinv*ez*jt;}
   vz=0;
  }
  if(deep)py-=deep;
  if(wallDeep){px-=wall.dir*wall.axis[0]*wallDeep*.8;py-=wall.dir*wall.axis[1]*wallDeep*.8;}
  let landed=false;
  if(impulse>mark){const last=contacts[contacts.length-1];if(last&&t-last.t<.035)last.impulse=Math.max(last.impulse,impulse);else{contacts.push({t,impulse});landed=true;}}
  // The pull home waits until a die headed for the page has met it.
  if(touching){const k=1-1.6*dt;wx*=k;wy*=k;wz*=k;vx*=1-.9*dt;if(!wall||knock!==null)vx-=px*home*dt;}
  // Frames at 120 a second, plus the exact moment of each landing.
  if(step%2===0||landed)frames.push({t,q:[...q],x:px,y:py});
  still=touching&&Math.hypot(vx,vy)<.08*s&&Math.hypot(wx,wy,wz)<1.2?still+dt:0;if(still>.08)break;
 }
 return {frames,contacts,knock,duration:t,q,x:px,y:py};
}
// The throw a visitor sees: real bounces, re-thrown until one comes to rest flat on the chosen face, near
// home, and, toward the page, striking its edge in mid-air before the first landing. camera maps the
// die's world to the screen, so the page edge is met where it is drawn. Falls back to a scripted arc.
function makeDiePlan(from,value,random=Math.random,size=116,travelLimit=18,gesture=null,wall=null,camera=null){
 const between=(min,max)=>min+(max-min)*random(),sign=()=>random()<.5?-1:1;
 const strength=dieClamp(gesture?.strength||0),direction=gesture?.direction||(wall?Math.sign(wall.edge):sign());
 const axisX=camera?camera[0]:[1,0,0],axisY=camera?camera[1]:[0,1,0],g=30*size,reach=Math.max(travelLimit,size*(gesture?.velocity?.45:.3));
 const screen=(row,x,y)=>row[0]*x+row[1]*y;
 // A die let go from the hand is guided to the page beside it: it may tap the tray first, then meets the edge.
 const guided=!!gesture?.guided&&!!wall;
 const strike=wall&&(guided||Math.sign(wall.edge)===direction)?{dir:Math.sign(wall.edge),axis:axisX,edge:wall.edge}:null;
 // A die already against the page cannot be thrown at it; the scripted hop handles that.
 if(strike){
  const M=quatMatrix(from.q);let far=-Infinity;
  for(const c of DIE_HULL){const P=[from.x+(M[0]*c[0]+M[1]*c[1]+M[2]*c[2])*size,from.y+(M[3]*c[0]+M[4]*c[1]+M[5]*c[2])*size,(M[6]*c[0]+M[7]*c[1]+M[8]*c[2])*size];far=Math.max(far,direction*(axisX[0]*P[0]+axisX[1]*P[1]+axisX[2]*P[2]));}
  if(strike.dir*wall.edge-far<size*.12)return dieArcPlan(from,value,random,size,travelLimit,gesture,wall);
 }
 // Re-throw until one fits, within a small time budget so a slow device never stalls on a hard case.
 const clock=typeof performance!=='undefined'?()=>performance.now():()=>0,started=clock();
 for(let attempt=0;attempt<90&&(attempt<8||clock()-started<(gesture?.velocity?22:14));attempt++){
  const height=size*(between(.36,.5)+strength*.22+(gesture?.flick?.08:0)),air=Math.max(0,-from.y-dieSupportLift(from.q,size));
  const vy=-Math.sqrt(2*g*Math.max(size*.12,height-air)),landing=(-vy+Math.sqrt(vy*vy+2*g*air))/g;
  let vx=direction*between(5,35)*(1+strength);
  // The hand's own speed carries into the throw; a drop just lets go.
  const hand=gesture?.velocity,across=Math.max(.5,Math.abs(axisX[0])),fast=2.4*Math.sqrt(g*size);
  // With no page beside it to stop the die, a hard sideways flick is reined in so it still lands on its tray.
  if(hand){const cap=strike?fast:size*1.6;vx=Math.max(-cap,Math.min(cap,hand[0]/across));}
  const dropping=!!gesture?.drop;
  let vyStart=dropping?between(-.1,.05)*Math.sqrt(g*size):vy;
  // An upward flick throws higher, but never more than about a die and a half above the tray.
  if(hand&&!dropping)vyStart=Math.max(-Math.sqrt(2*g*size*1.5),Math.min(fast*.6,Math.min(vy,hand[1]/.55)));
  if(strike){
   const gap=strike.dir*wall.edge-size*.62-strike.dir*screen(axisX,from.x,from.y);
   // Straight from a click, the die meets the edge in mid-air; from the hand, after a tap or two.
   const meet=guided?landing+between(.12,.4):between(.5,.72)*landing;
   vx=strike.dir*Math.max(40,Math.abs(strike.dir===Math.sign(vx)?vx*across:0),gap/meet)/across;
  }
  const turn=dropping?between(2,6):between(11,19)+strength*10+(gesture?.flick?4:0);
  const facing=quatRotate(from.q,DIE_NORMALS[value]),sideways=Math.hypot(facing[2],facing[0]),toward=sideways>.2?[-facing[2]/sideways,0,facing[0]/sideways]:[sign(),0,between(-.5,.5)];
  // Tumble about an axis that has the chosen face coming up as the die settles (it turns about three
  // quarters of a turn on the way), so that face is on its way round;
  // a flick keeps the turn the hand gave it. Either way, a little of the roll follows the throw.
  let axis=gesture?.axis?gesture.axis.map((c,k)=>c+toward[k]*.45+between(-.25,.25)):toward.map((c,k)=>c+between(-.3,.3)+(k===2?direction*between(0,.3):0));
  const length=Math.hypot(...axis)||1;axis=axis.map(c=>c/length*turn);
  // A drop is let go tilted: a small turn rights the face it showed on top as it falls.
  if(dropping){const tilt=Math.acos(Math.max(-1,Math.min(1,-facing[1])));axis=sideways>.05?[facing[2]/sideways*tilt/between(.22,.32)+between(-.6,.6),between(-.4,.4),-facing[0]/sideways*tilt/between(.22,.32)+between(-.6,.6)]:[between(-1.5,1.5),between(-1,1),between(-1.5,1.5)];}
  // Let go flat, a die skids across the felt to the edge rather than tumbling there.
  const run=simulateDieThrow({from,size,velocity:[vx,vyStart],spin:axis,wall:strike,friction:dropping&&strike?.22:.55});
  if(dieTopFace(run.q)!==value||Math.abs(run.x)>reach||run.duration<.45||run.duration>2.5)continue;
  const flat=dieSnap(run.q,value);if(Math.abs(flat.reduce((sum,c,i)=>sum+c*run.q[i],0))<Math.cos(4*Math.PI/180))continue;
  const first=run.contacts[0]?.t??run.duration;
  if(strike&&(run.knock===null||(guided?run.knock>(run.contacts[2]?.t??run.duration)||run.knock>1.4:run.knock>=first)))continue;
  // Settle the last few degrees onto the face over a short beat.
  const end=run.duration+.06,last=run.frames[run.frames.length-1];
  run.frames.push({t:end,q:flat,x:last.x,y:-dieSupportLift(flat,size)});
  const top=Math.max(...run.contacts.map(c=>c.impulse),1e-9);
  const plan={kind:'physics',from,target:flat,size,duration:end*1000,frames:run.frames.map(f=>({...f,t:f.t/end})),contacts:run.contacts.map(c=>c.t/end),levels:run.contacts.map(c=>Math.min(1,c.impulse/top)),turns:1+Math.round(strength*2),knock:null};
  if(strike){plan.knock=run.knock/end;plan.edge=wall.edge;const at=sampleDiePlan(plan,plan.knock);if(!guided&&at.air<=2)continue;plan.strikeY=screen(axisY,at.x,at.y);}
  return plan;
 }
 return dieArcPlan(from,value,random,size,travelLimit,gesture,wall);
}
// The scripted fallback. wall: the page edge beside the die, as {edge} = signed distance from the die's
// rest centre. A throw toward it strikes the edge in mid-air, rebounds, and lands back on its own tray.
function dieArcPlan(from,value,random=Math.random,size=116,travelLimit=18,gesture=null,wall=null){
 const between=(min,max)=>min+(max-min)*random(),sign=()=>random()<.5?-1:1;
 const yaw=Math.floor(random()*4)*Math.PI/2+between(-.16,.16);
 const strength=dieClamp(gesture?.strength||0),direction=gesture?.direction||(wall?Math.sign(wall.edge):sign());
 const flight=between(230,285)+strength*65;
 // A click lands with a bounce and a last small hop. A flick from the hand is livelier: it keeps tapping,
 // three to five hops that each lose less height, more the harder it was thrown.
 const hops=[];
 if(gesture?.flick){let hop=flight;for(let n=3+Math.round(strength*2);n>0;n--){hop*=between(.64,.70);hops.push(hop);}}
 else{const bounce=flight*between(.46,.55);hops.push(bounce,bounce*between(.40,.50));}
 const settle=between(85,115),duration=flight+hops.reduce((sum,hop)=>sum+hop,0)+settle;
 const contacts=[flight/duration];hops.forEach(hop=>contacts.push(contacts[contacts.length-1]+hop/duration));
 let drift=direction*between(travelLimit*(.45+strength*.25),travelLimit);
 if(gesture?.direction)drift=direction>0?Math.max(from.x,drift):Math.min(from.x,drift);
 const axis=gesture?.axis||[sign()*between(.55,1),between(-.35,.35),-direction*between(.55,1)];
 const plan={from,target:dieLanding(value,yaw),size,duration,axis,turns:1+Math.round(strength*2),drift,lift:between(26,31)+strength*10,rock:sign()*between(.025,.045),contacts,hopPower:gesture?.flick?1.5:2,knock:null};
 if(wall&&Math.sign(wall.edge)===direction){
  // Strike late in the first flight, while still airborne. The edge is met by the die's own
  // extent; callers that know the camera refine plan.wall with dieKnockWall.
  plan.knock=plan.contacts[0]*between(.58,.66);
  plan.edge=wall.edge;plan.wall=wall.edge-direction*size*.62;
  if((plan.wall-from.x)*direction<0)plan.wall=from.x;
  plan.endX=direction*between(1,5);plan.drift=plan.wall;
 }
 return plan;
}
// Position along the throw for a knocking plan: straight to the edge, reverse at the strike,
// then lose lateral speed at each landing until the die rests near home, never past the strike.
const dieKnockPace=j=>j===0?1:j===1?.6:.3*.5**(j-2);
function dieKnockX(plan,t){
 const contacts=plan.contacts,k=plan.knock,from=plan.from.x,wall=plan.wall,direction=Math.sign(plan.edge);
 if((plan.endX-wall)*direction>0)plan.endX=wall;
 if(t<=k)return from+(wall-from)*(t/k);
 const marks=[k,...contacts],last=marks[marks.length-1],tail=Math.min(.1,dieKnockPace(contacts.length));
 const span=contacts.reduce((sum,_,j)=>sum+dieKnockPace(j)*(marks[j+1]-marks[j]),tail*.5*(1-last)),v=(plan.endX-wall)/span;
 let x=wall;
 for(let j=0;j<contacts.length;j++){x+=dieKnockPace(j)*v*(Math.min(t,marks[j+1])-marks[j]);if(t<=marks[j+1])return x;}
 const s=(t-last)/(1-last);return x+tail*v*(1-last)*(s-s*s/2);
}
// Progress through a throw that is `first` done at the first landing and `end` done at the last. The rest
// is shared across the hops by their length, slowing at each landing.
function dieHopProgress(contacts,t,first,end){
 const hit=contacts[0];if(t<=hit)return t/hit*first;
 let total=0,done=0;
 for(let j=1;j<contacts.length;j++){const weight=.55**(j-1);total+=(contacts[j]-contacts[j-1])*weight;done+=Math.max(0,Math.min(t,contacts[j])-contacts[j-1])*weight;}
 return total?first+(end-first)*done/total:end;
}
function sampleDiePlan(plan,t){
 t=dieClamp(t);
 if(plan.kind==='physics'){
  const frames=plan.frames;let lo=0,hi=frames.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(frames[mid].t<=t)lo=mid;else hi=mid;}
  const a=frames[lo],b=frames[hi],k=b.t>a.t?dieClamp((t-a.t)/(b.t-a.t)):0;
  const q=t>=1?plan.target:quatSlerp(a.q,b.q,k),x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k;
  return {q,x,y,air:Math.max(0,-y-dieSupportLift(q,plan.size))};
 }
 if(plan.kind==='settle'){
  const ease=1-(1-t)**3,q=quatSlerp(plan.from.q,plan.target,ease),air=Math.max(0,-plan.from.y-dieSupportLift(plan.from.q,plan.size))*(1-ease);
  return {q,x:plan.from.x,y:-air-dieSupportLift(q,plan.size),air};
 }
 if(plan.kind==='invitation'){
  const rock=Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI)**2;
  const q=quatMultiply(quatAxis([0,0,1],rock*.13),plan.from.q);
  return {q,x:plan.from.x,y:-dieSupportLift(q,plan.size),air:0};
 }
 const contacts=plan.contacts,hit=contacts[0],last=contacts[contacts.length-1];
 // Rotation loses speed at impact; lateral travel never reverses in mid-air.
 const phase=t<=last?dieHopProgress(contacts,t,.68,1):1;
 let q=quatMultiply(quatAxis(plan.axis,Math.PI*2*plan.turns*phase),quatSlerp(plan.from.q,plan.target,phase));
 if(t>last){const settle=(t-last)/(1-last);q=quatMultiply(quatAxis([0,0,1],Math.sin(settle*Math.PI)*plan.rock*(1-settle)),plan.target);}
 const travel=t<=last?dieHopProgress(contacts,t,.67,.98):.98+.02*(1-(1-(t-last)/(1-last))**2);
 const x=plan.knock!=null?dieKnockX(plan,t):plan.from.x+(plan.drift-plan.from.x)*travel;
 let air=0;
 if(t<=hit){const p=t/hit,fromAir=Math.max(0,-plan.from.y-dieSupportLift(plan.from.q,plan.size));air=fromAir*(1-p)+4*plan.lift*p*(1-p);}
 else if(t<=last){
  // Each hop rises by its own length; a flick's hops keep a little more height so every tap shows.
  const j=contacts.findIndex(contact=>t<=contact),from=contacts[j-1],to=contacts[j],p=(t-from)/(to-from);
  air=4*plan.lift*((to-from)/hit)**(plan.hopPower||2)*p*(1-p);
 }
 q=t===1?plan.target:q;
 return {q,x,y:-air-dieSupportLift(q,plan.size),air};
}
