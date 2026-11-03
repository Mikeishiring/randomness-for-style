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
function makeDiePlan(from,value,random=Math.random,size=116,travelLimit=18,gesture=null){
 const between=(min,max)=>min+(max-min)*random(),sign=()=>random()<.5?-1:1;
 const yaw=Math.floor(random()*4)*Math.PI/2+between(-.16,.16);
 const strength=dieClamp(gesture?.strength||0),direction=gesture?.direction||sign();
 const flight=between(230,285)+strength*65,bounce=flight*between(.46,.55),last=bounce*between(.40,.50),settle=between(85,115),duration=flight+bounce+last+settle;
 let drift=direction*between(travelLimit*(.45+strength*.25),travelLimit);
 if(gesture?.direction)drift=direction>0?Math.max(from.x,drift):Math.min(from.x,drift);
 const axis=gesture?.axis||[sign()*between(.55,1),between(-.35,.35),-direction*between(.55,1)];
 return {from,target:dieLanding(value,yaw),size,duration,axis,turns:1+Math.round(strength*2),drift,lift:between(26,31)+strength*10,rock:sign()*between(.025,.045),contacts:[flight/duration,(flight+bounce)/duration,(flight+bounce+last)/duration]};
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
 const [hit,bounce,last]=plan.contacts;
 // Rotation loses speed at impact; lateral travel never reverses in mid-air.
 const phase=t<=hit?t/hit*.68:t<=bounce?.68+(t-hit)/(bounce-hit)*.24:t<=last?.92+(t-bounce)/(last-bounce)*.08:1;
 let q=quatMultiply(quatAxis(plan.axis,Math.PI*2*plan.turns*phase),quatSlerp(plan.from.q,plan.target,phase));
 if(t>last){const settle=(t-last)/(1-last);q=quatMultiply(quatAxis([0,0,1],Math.sin(settle*Math.PI)*plan.rock*(1-settle)),plan.target);}
 const travel=t<=hit?t/hit*.67:t<=bounce?.67+(t-hit)/(bounce-hit)*.23:t<=last?.90+(t-bounce)/(last-bounce)*.08:.98+.02*(1-(1-(t-last)/(1-last))**2);
 const x=plan.from.x+(plan.drift-plan.from.x)*travel;
 let air;
 if(t<=hit){const p=t/hit,fromAir=Math.max(0,-plan.from.y-dieSupportLift(plan.from.q,plan.size));air=fromAir*(1-p)+4*plan.lift*p*(1-p);}
 else if(t<=bounce){const p=(t-hit)/(bounce-hit),lift=plan.lift*((bounce-hit)/hit)**2;air=4*lift*p*(1-p);}
 else if(t<=last){const p=(t-bounce)/(last-bounce),lift=plan.lift*((last-bounce)/hit)**2;air=4*lift*p*(1-p);}
 else air=0;
 q=t===1?plan.target:q;
 return {q,x,y:-air-dieSupportLift(q,plan.size),air};
}
