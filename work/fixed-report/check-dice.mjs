import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const nodes=new Map(),animations=[],soundCalls=[],motion={matches:false};
for(const i of [0,1]){
 nodes.set('#ingredient-'+(i?'b':'a'),{textContent:''});
 nodes.set('#throw-'+i,{attrs:{},setAttribute(k,v){this.attrs[k]=v}});
 for(const kind of ['cube','die-flight','die-shadow','die-ground'])nodes.set(`#throw-${i} .${kind}`,{style:{},animate(frames,options){const a={frames,options,currentTime:0,cancelled:false,cancel(){this.cancelled=true}};animations.push(a);return a;}});
}
const context=vm.createContext({assert,console,clearTimeout,setTimeout,nodes,animations,soundCalls,motion,performance:{now:()=>100},matchMedia:()=>motion,document:{hidden:false},$:s=>nodes.get(s),resetDieInteraction(){},primeDiceAudio(){},cancelDieSound:i=>soundCalls.push(['cancel',i]),playDiceClatter:(i,plan)=>soundCalls.push(['play',i,plan.contacts]),initDiceSound(){}});
vm.runInContext(read('dice-math.js')+'\n'+read('dice.js')+`
let a=0,b=4,active='original';const worlds=['a','b','c','d','e','f'].map(name=>({name})),modes={original:{options:['tech','disco','diner','opera','hotel','insects'].map(layout=>({layout,name:layout}))}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
for(let value=0;value<DIE_FACE_VALUES.length;value++)for(let turn=0;turn<16;turn++){
 const q=dieLanding(value,turn*Math.PI/8),up=quatRotate(q,DIE_NORMALS[value]);up.forEach((n,i)=>near(n,[0,-1,0][i]));
 // The CSS matrix must rotate the same fixed normal as the quaternion.
 const matrix=quatCSS(q).slice(9,-1).split(',').map(Number),normal=DIE_NORMALS[value];
 for(let row=0;row<3;row++)near(matrix[row]*normal[0]+matrix[4+row]*normal[1]+matrix[8+row]*normal[2],[0,-1,0][row]);
}
let seed=42;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296),directions=new Set(),axes=new Set(),durations=new Set();
const faceMarkup=[dieFaceMarkup(0),dieFaceMarkup(1)];
assert.equal(DIE_FACE_VALUES.length,6);
for(const markup of faceMarkup){assert.equal([...markup.matchAll(/data-choice=/g)].length,6);assert.ok(!/undefined|DESIGN DICE|cube-cross/.test(markup));}

// Raw height of the lowest point above the tray (negative when it sinks in), and the die's reach across the screen.
const clearance=(sample,size)=>-sample.y-dieSupportLift(sample.q,size);
const screenReach=(sample,size,direction)=>{const M=quatMatrix(sample.q);let far=-Infinity;for(const c of DIE_HULL)far=Math.max(far,direction*(sample.x+(M[0]*c[0]+M[1]*c[1]+M[2]*c[2])*size));return far;};
const flatOn=(q,value)=>quatRotate(q,DIE_NORMALS[value]).forEach((n,i)=>assert.ok(Math.abs(n-[0,-1,0][i])<1e-6,'lands flat on the chosen face'));
let pose={q:dieLanding(4),x:0,y:0},physical=0;
for(let n=0;n<300;n++){
 const value=n%DIE_FACE_VALUES.length,plan=makeDiePlan(pose,value,random);
 if(plan.kind==='physics')physical++;
 durations.add(Math.round(plan.duration/10));directions.add(Math.sign(sampleDiePlan(plan,.2).x-pose.x));
 assert.ok(plan.duration>=450&&plan.duration<=2700,'a throw takes about a second, not forever');
 for(let step=0;step<=60;step++){
  const t=step/60,sample=sampleDiePlan(plan,t);near(Math.hypot(...sample.q),1);assert.ok(Number.isFinite(sample.x+sample.y));
  assert.ok(clearance(sample,plan.size)>-2.5,'the die never sinks into the tray');
  if(t===0){near(sample.x,pose.x);near(sample.y,pose.y);near(Math.abs(sample.q.reduce((sum,v,i)=>sum+v*pose.q[i],0)),1);}
 }
 // Every recorded impact is the die meeting the tray, and the first is the hardest or close to it.
 plan.contacts.forEach(t=>assert.ok(clearance(sampleDiePlan(plan,t),plan.size)<3,'contacts happen on the tray'));
 assert.ok(plan.contacts.length>=2,'it bounces before it settles');
 pose=sampleDiePlan(plan,1);flatOn(pose.q,value);assert.equal(dieTopFace(pose.q),value);
 assert.ok(Math.abs(pose.x)<=Math.max(18,plan.size*.3)+1e-6,'it comes to rest near home');
}
assert.ok(physical>=290,'nearly every throw is simulated: '+physical);
assert.equal(directions.size,2);assert.ok(durations.size>40);
const flickStart={q:dieLanding(2),x:8,y:0};
const flickRight=makeDiePlan(flickStart,1,()=>.5,116,20,{direction:1,strength:1}),flickLeft=makeDiePlan(flickStart,1,()=>.5,116,20,{direction:-1,strength:.2});
assert.equal(flickRight.turns,3);assert.equal(flickLeft.turns,1);
// A flick from the hand is livelier than a click: on average it bounces more and runs longer.
{let clicks=0,flicks=0,clickTime=0,flickTime=0;
 for(let n=0;n<80;n++){
  const click=makeDiePlan({q:dieLanding(n%6),x:0,y:0},(n+2)%6,random),flick=makeDiePlan({q:dieLanding(n%6),x:0,y:0},(n+2)%6,random,116,18,{direction:n%2?1:-1,strength:.4+(n%7)/10,axis:[0,0,n%2?1:-1],flick:true});
  clicks+=click.contacts.length;flicks+=flick.contacts.length;clickTime+=click.duration;flickTime+=flick.duration;flatOn(sampleDiePlan(flick,1).q,(n+2)%6);
 }
 assert.ok(flicks>=clicks&&flickTime>clickTime,'flicks keep bouncing longer: '+flicks+' vs '+clicks);}
// A throw toward the page beside it strikes the edge in mid-air, before its first landing, and never
// reaches past it; it then comes back to rest near home.
for(let n=0;n<200;n++){
 const edge=(n%2?-1:1)*(70+(n%5)*25),home={q:dieLanding(n%6),x:(n%3-1)*4,y:0},gesture=n%4===3?{direction:Math.sign(edge),strength:(n%7)/6,flick:n%8===7}:null;
 const plan=makeDiePlan(home,n%6,random,116,18,gesture,{edge});
 dieKnockWall(n%2,plan);
 const direction=Math.sign(edge),[hit]=plan.contacts;
 assert.ok(plan.knock>0&&plan.knock<hit,'the strike comes before the first landing');
 assert.ok(sampleDiePlan(plan,plan.knock).air>1,'the die strikes the page in mid-air');
 for(let step=0;step<=200;step++){
  const sample=sampleDiePlan(plan,step/200);
  if(plan.kind==='physics')assert.ok(screenReach(sample,plan.size,direction)<=direction*edge+2,'never passes the page edge');
  else assert.ok((sample.x-plan.wall)*direction<=1e-8,'never passes the page edge');
 }
 plan.contacts.forEach(t=>assert.ok(clearance(sampleDiePlan(plan,t),plan.size)<3));
 const end=sampleDiePlan(plan,1);assert.ok(Math.abs(end.x)<=Math.max(18,plan.size*.3)+1e-6,'it comes back to rest near home');
 flatOn(end.q,n%6);
}
// The tray gives under each landing as hard as that landing was, with keyframe offsets always in order.
for(let n=0;n<60;n++){
 const plan=makeDiePlan({q:dieLanding(n%6),x:0,y:0},n%6,random,116,18,null,n%2?{edge:140}:null);
 const before=animations.length;animateDiePlan(0,plan,n%6);
 const ground=animations.slice(before).find(a=>a.frames.some(f=>'scale' in f));assert.ok(ground,'the tray reacts');
 const offsets=ground.frames.map(f=>f.offset);offsets.forEach((o,k)=>assert.ok(o>=0&&o<=1&&(k===0||o>=offsets[k-1]),'tray keyframes stay in order'));
 const depth=plan.contacts.map(c=>{const frame=ground.frames.find(f=>f.offset>c&&f.scale!=='1');return 1-Number(frame.scale.split(' ')[0]);});
 depth.forEach((d,k)=>assert.ok(Math.abs(d-.045*(plan.levels?.[k]??.58**k))<1e-9,'each dip follows its impact'));
 assert.ok(Math.max(...depth)>=.045-1e-9||!plan.levels,'the hardest landing presses the tray the most');
 stopDieMotion(0);
}
animations.length=0;
// Thrown away from the page, or with the page out of reach, there is no strike.
assert.equal(makeDiePlan({q:dieLanding(0),x:0,y:0},0,random,116,18,{direction:-1,strength:.5},{edge:80}).knock,null);
assert.equal(makeDiePlan({q:dieLanding(0),x:0,y:0},0,random,116,18,null,null).knock,null);
// A die already against the page hops in place to strike it.
const pressed=makeDiePlan({q:dieLanding(0),x:40,y:0},0,random,116,18,null,{edge:60});assert.ok(pressed.wall>=40);
// A held cube can reach every face; leveling preserves that face and uses a short rotation.
for(let value=0;value<6;value++){
 const start={q:dieLanding(value,.24),x:0,y:0},reached=new Set();
 for(const [dx,dy] of [[0,0],[94,0],[-94,0],[0,94],[0,-94],[188,0]]){
  const pose=dieGrabPose(start,dx,dy,94),top=dieTopFace(pose.q),snap=dieSnap(pose.q);
  reached.add(top);quatRotate(snap,DIE_NORMALS[top]).forEach((n,i)=>near(n,[0,-1,0][i]));
  assert.equal(dieTopFace(snap),top);near(Math.hypot(...pose.q),1);assert.ok(Math.abs(pose.x)<=16);
 }
 assert.equal(reached.size,6);
}
syncDice3D();let completed=0;
tumbleDice([0,1],[2,3],()=>completed++);assert.equal(animations.length,8,'cube, flight, shadow and tray for each die');
const old=dieStates.map(s=>s.running);
old.forEach(r=>{r.animations[0].currentTime=r.plan.duration*.42});
const inFlight=old.map(r=>sampleDiePlan(r.plan,.42));
tumbleDice([0,1],[1,0],()=>completed++);
for(let i=0;i<2;i++){assert.ok(old[i].animations.every(a=>a.cancelled));near(dieStates[i].running.plan.from.x,inFlight[i].x);near(dieStates[i].running.plan.from.y,inFlight[i].y);old[i].animations[0].onfinish();}
assert.equal(completed,0);
dieStates[0].running.animations[0].onfinish();assert.equal(completed,0);dieStates[1].running.animations[0].onfinish();assert.equal(completed,1);
assert.equal(dieStates[0].value,1);assert.equal(dieStates[1].value,0);
for(let value=0;value<DIE_FACE_VALUES.length;value++){a=value;b=5-value;syncDice3D();assert.equal(dieFaceMarkup(0),faceMarkup[0]);assert.equal(dieFaceMarkup(1),faceMarkup[1]);}
tumbleDice([0,1],[3,2],()=>completed++);cancelDiceRoll();assert.equal(completed,1);syncDice3D();near(dieStates[0].pose.y,0);assert.equal(dieStates[0].value,a);
motion.matches=true;const count=animations.length;tumbleDice([0,1],[2,1],()=>completed++);assert.equal(animations.length,count);assert.equal(completed,2);
motion.matches=false;document.hidden=true;tumbleDice([0,1],[1,2],()=>completed++);assert.equal(animations.length,count);assert.equal(completed,3);
document.hidden=false;tumbleDice([0,1],[0,4],()=>completed++);[0,1].forEach(i=>stopDieMotion(i));assert.equal(completed,4);assert.equal(activeDiceRoll,null);
// A click on one die must preserve the other, including an ongoing throw.
syncDice3D();const still=JSON.stringify(dieStates[1].pose),startCount=animations.length;
tumbleDice([0],[2,b],()=>completed++);assert.equal(animations.length,startCount+4);assert.equal(JSON.stringify(dieStates[1].pose),still);
const leftRun=dieStates[0].running;leftRun.animations[0].currentTime=123;
tumbleDice([1],[2,3],()=>completed++);assert.equal(dieStates[0].running,leftRun);assert.equal(leftRun.animations[0].currentTime,123);assert.ok(!leftRun.animations[0].cancelled);
const rightRun=dieStates[1].running;rightRun.animations[0].currentTime=150;
tumbleDice([1],[2,4],()=>completed++);assert.equal(dieStates[0].running,leftRun);assert.ok(rightRun.animations.every(animation=>animation.cancelled));rightRun.animations[0].onfinish();assert.equal(completed,4);
leftRun.animations[0].onfinish();assert.equal(completed,4);dieStates[1].running.animations[0].onfinish();assert.equal(completed,5);assert.equal(dieStates[0].value,2);assert.equal(dieStates[1].value,4);
// Grabbing an airborne cube retains its presentation; release starts there.
a=2;b=4;syncDice3D();tumbleDice([0],[a,b],()=>completed++);
const grabbedRun=dieStates[0].running;grabbedRun.animations[0].currentTime=grabbedRun.plan.duration*.32;
const expectedGrab=sampleDiePlan(grabbedRun.plan,.32),grab=beginDieGrab(0);
near(grab.x,expectedGrab.x);near(grab.y,expectedGrab.y);assert.equal(dieStates[0].running,null);
moveDieGrab(0,grab,-70,25);const held={...dieStates[0].pose};near(held.x,grab.x);near(held.g[0],-70);near(held.g[1],25);assert.ok(held.air>=0,'a carried die goes where the pointer goes, off the tray');
tumbleDice([0],[3,b],()=>completed++,{direction:-1,strength:.7});
near(dieStates[0].running.plan.from.x,held.x);near(dieStates[0].running.plan.from.y,held.y);
beginDieGrab(0);settleDieGrab(0);const settling=dieStates[0].running;
const stillStart=sampleDiePlan(settling.plan,0);near(stillStart.y,settling.plan.from.y);
settling.animations[0].onfinish();assert.equal(dieStates[0].value,a);near(dieStates[0].pose.y,0);
const invitation={kind:'invitation',from:{q:dieLanding(a),x:0,y:0},size:104,duration:850,contacts:[]};
assert.ok(Math.abs(sampleDiePlan(invitation,.25).y)>0);near(sampleDiePlan(invitation,1).y,0);
motion.matches=true;const beforeReduced={...dieStates[0].pose};moveDieGrab(0,beforeReduced,104);assert.notEqual(dieTopFace(dieStates[0].pose.q),dieTopFace(beforeReduced.q));settleDieGrab(0);assert.equal(dieStates[0].running,null);
assert.ok(soundCalls.length>0&&soundCalls.every(call=>call[0]==='play'),'every throw schedules its contact sounds');
// A thrown die travels across the screen on top of its tumble. Thrown at a spot it comes to rest there, feels
// the page where it first lands on it, stays inside the arena however hard it is thrown, and ends on its tray.
for(let n=0;n<40;n++){
 const plan=makeDiePlan({q:dieLanding(n%6),x:0,y:0},(n+2)%6,random,116,18,{direction:1,strength:.25,axis:[-.3,0,.95]},null),target=[260+n*9,120+n*4];
 const toss=dieTravel(plan,{target,bounds:[-90,-60,900,640]});
 near(toss.path[0].x,0);near(toss.rest[0],target[0]);near(toss.rest[1],target[1]);
 assert.ok(toss.duration>plan.duration,'coming home takes a moment after the tumble ends');
 const home=sampleDieTravel(toss,toss.duration);near(home[0],0);near(home[1],0);
 const landing=sampleDieTravel(toss,plan.contacts[0]*plan.duration);assert.ok(landing[0]>0&&landing[0]<target[0],'the first landing is on the way there');
 const flick=dieTravel(plan,{velocity:[2600,-1800],bounds:[-90,-60,900,640]});
 assert.ok(flick.path.every(point=>point.x>=-90-1e-6&&point.x<=900+1e-6&&point.y>=-60-1e-6-116*.42),'a hard throw turns back at the edges');
 const end=sampleDieTravel(flick,flick.duration);near(end[0],0);near(end[1],0);
 const still=dieTravel(plan,{velocity:[0,0]});assert.equal(still.duration,plan.duration,'a die that goes nowhere has no way home to make');
}
{const from={q:dieLanding(2),x:0,y:0,g:[40,10]},pose=dieHoldPose(from,300,200,116,{bounds:[-50,-50,200,150]});assert.deepEqual(pose.g,[200,150],'a held die stops at the edge of the arena');near(pose.x,0);}
// Idle preparation does not settle for the scripted hop: a search that ran out of time is tried again on a
// later idle slice. A die that cannot be simulated keeps the hop after a few tries instead of searching forever.
var view='dice';const prepIdle=[],prepSlice={timeRemaining:()=>50},prepReal=makeDiePlan;let prepCount=0,prepGuard=0;
globalThis.requestIdleCallback=fn=>{prepIdle.push(fn);return prepIdle.length;};
motion.matches=false;dieStates[0].running=null;preparedThrows[0].clear();
makeDiePlan=(...args)=>++prepCount<=2?dieArcPlan(...args.slice(0,5)):prepReal(...args);
prepareThrows(0);while(prepIdle.length&&prepGuard++<60)prepIdle.shift()(prepSlice);
assert.equal(preparedThrows[0].size,6);assert.ok([...preparedThrows[0].values()].every(ready=>ready.plan.kind==='physics'),'a missed search is retried, not kept');
preparedThrows[0].clear();throwMisses[0].key='';prepCount=0;prepGuard=0;makeDiePlan=(...args)=>{prepCount++;return dieArcPlan(...args.slice(0,5));};
prepareThrows(0);while(prepIdle.length&&prepGuard++<60)prepIdle.shift()(prepSlice);
assert.equal(preparedThrows[0].size,6);assert.equal(prepCount,6*THROW_RETRIES,'the hop is kept once the retries are spent');
makeDiePlan=prepReal;delete globalThis.requestIdleCallback;
console.log('PASS: 96 exact face-up orientations/CSS matrices; 300 simulated throws that bounce on the tray, never sink into it and land flat on the chosen face near home; stable face markup; flicks livelier than clicks; a tray that gives with each impact; 200 page strikes in mid-air that never pass the edge; mid-air retargeting; stale callbacks; completion after both land; cancellation and reduced motion; a die carried with the pointer; throws that travel to a spot, turn back at the edges and come home; idle preparation that retries a missed search before keeping the scripted hop.');
`,context);
