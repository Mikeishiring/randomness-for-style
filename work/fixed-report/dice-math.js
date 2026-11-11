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
 const align=dot>.999999?[0,0,0,1]:dot<-.999999?quatAxis([1,0,0],Math.PI):quatAxis([normal[2],0,-normal[0]],Math.acos(dot));
 return quatUnit(quatMultiply(align,q));
}
function dieGrabPose(from,dx,dy,size=94){
 const angle=Math.hypot(dx,dy)*Math.PI/(size*2);
 const rotation=angle?quatAxis([-dy,0,dx],angle):[0,0,0,1];
 const q=quatUnit(quatMultiply(rotation,from.q));
 const air=Math.max(0,-from.y-dieSupportLift(from.q,size));
 return {q,x:Math.max(-16,Math.min(16,from.x+10*Math.tanh(dx/90))),y:-air-dieSupportLift(q,size),air};
}
function dieSupportLift(q,size=116){
 const axes=[[1,0,0],[0,1,0],[0,0,1]],halfExtent=axes.reduce((sum,axis)=>sum+Math.abs(quatRotate(q,axis)[1]),0);
 return Math.max(0,(halfExtent-1)*size*.5*.54);
}
// wall: the page edge beside the die, as {edge} = signed distance from the die's rest centre.
// A throw toward it strikes the edge in mid-air, rebounds, and lands back on the die's own tray.
function makeDiePlan(from,value,random=Math.random,size=116,travelLimit=18,gesture=null,wall=null){
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
