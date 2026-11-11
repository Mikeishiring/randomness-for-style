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

let pose={q:dieLanding(4),x:0,y:0};
for(let n=0;n<500;n++){
 const value=n%DIE_FACE_VALUES.length,plan=makeDiePlan(pose,value,random);directions.add(Math.sign(plan.drift));axes.add(Math.sign(plan.axis[0])+','+Math.sign(plan.axis[2]));durations.add(Math.round(plan.duration));
 assert.ok(plan.duration>=460&&plan.duration<650);
 for(const t of [0,.125,.27,.55,.66,.77,.91,1]){
  const sample=sampleDiePlan(plan,t);near(Math.hypot(...sample.q),1);assert.ok(Number.isFinite(sample.x+sample.y));assert.ok(sample.y<=1e-8);
  if(t===0){near(sample.x,pose.x);near(sample.y,pose.y);near(Math.abs(sample.q.reduce((sum,v,i)=>sum+v*pose.q[i],0)),1);}
 }
 plan.contacts.forEach(t=>{const sample=sampleDiePlan(plan,t);near(sample.air,0);near(sample.y+dieSupportLift(sample.q,plan.size),0);});
 // Gravity uses the same acceleration for diminishing hops; impact reduces lateral speed.
 const [hit,bounce,last]=plan.contacts;assert.ok(bounce-hit<hit&&last-bounce<bounce-hit);
 assert.ok(.67/hit>.23/(bounce-hit)&&.23/(bounce-hit)>.08/(last-bounce));
 let previous=pose.x;
 for(let step=1;step<=100;step++){const sample=sampleDiePlan(plan,step/100);assert.ok((sample.x-previous)*Math.sign(plan.drift-pose.x)>=-1e-8);previous=sample.x;}
 pose=sampleDiePlan(plan,1);quatRotate(pose.q,DIE_NORMALS[value]).forEach((n,i)=>near(n,[0,-1,0][i]));
}
assert.equal(directions.size,2);assert.equal(axes.size,4);assert.ok(durations.size>90);
const flickStart={q:dieLanding(2),x:15,y:0};
const flickRight=makeDiePlan(flickStart,1,()=>.5,116,20,{direction:1,strength:1}),flickLeft=makeDiePlan(flickStart,1,()=>.5,116,20,{direction:-1,strength:.2});
assert.ok(flickRight.drift>=flickStart.x);assert.ok(flickLeft.drift<flickStart.x);assert.equal(flickRight.turns,3);assert.equal(flickLeft.turns,1);assert.ok(flickRight.lift>flickLeft.lift);assert.ok(flickRight.duration>flickLeft.duration);
// A throw toward the page beside it strikes the edge in mid-air, rebounds and lands back home.
// Lateral travel reverses only at the strike, and the die never passes the page edge.
for(let n=0;n<300;n++){
 const edge=(n%2?-1:1)*(70+(n%5)*20),home={q:dieLanding(n%6),x:(n%3-1)*4,y:0},gesture=n%4===3?{direction:Math.sign(edge),strength:(n%7)/6,flick:n%8===7}:null;
 const plan=makeDiePlan(home,n%6,random,116,18,gesture,{edge});
 dieKnockWall(n%2,plan);
 const direction=Math.sign(edge),[hit]=plan.contacts;
 assert.ok(plan.knock>0&&plan.knock<hit,'the strike comes before the first landing');
 assert.ok(sampleDiePlan(plan,plan.knock).air>1,'the die strikes the page in mid-air');
 near(sampleDiePlan(plan,plan.knock).x,plan.wall);
 assert.ok((plan.wall-home.x)*direction>=0&&(plan.edge-plan.wall)*direction>0,'the die travels toward the page and stops at its own edge');
 let previous=home.x;
 for(let step=1;step<=200;step++){
  const t=step/200,before=(step-1)/200,sample=sampleDiePlan(plan,t);
  assert.ok((sample.x-plan.wall)*direction<=1e-8,'never passes the page edge');
  // A step that spans the strike is checked in its two halves: up to the edge, then back.
  if(before<plan.knock&&t>plan.knock){assert.ok((plan.wall-previous)*direction>=-1e-8&&(sample.x-plan.wall)*direction<=1e-8,'reverses only at the strike');}
  else{const towards=t<=plan.knock;assert.ok((sample.x-previous)*direction*(towards?1:-1)>=-1e-8,'reverses only at the strike');}
  previous=sample.x;
 }
 plan.contacts.forEach(t=>near(sampleDiePlan(plan,t).air,0));
 const end=sampleDiePlan(plan,1);near(end.x,plan.endX);assert.ok(Math.abs(end.x)<=5,'it comes back to rest near home');
 quatRotate(end.q,DIE_NORMALS[n%6]).forEach((v,i)=>near(v,[0,-1,0][i]));
}
// A flick from the hand keeps tapping: more hops than a click, each shorter than the last, every one still a
// visible lift off the tray, and it still lands flat on the chosen face.
for(let n=0;n<200;n++){
 const strength=(n%11)/10,plan=makeDiePlan({q:dieLanding(n%6),x:0,y:0},n%6,random,116,18,{direction:n%2?1:-1,strength,flick:true});
 assert.equal(plan.contacts.length,4+Math.round(strength*2));
 plan.contacts.forEach((t,j)=>{near(sampleDiePlan(plan,t).air,0);if(j>1)assert.ok(t-plan.contacts[j-1]<plan.contacts[j-1]-plan.contacts[j-2]);});
 const [a,b]=plan.contacts.slice(-2);assert.ok(sampleDiePlan(plan,(a+b)/2).air>1,'the last tap still lifts');
 quatRotate(sampleDiePlan(plan,1).q,DIE_NORMALS[n%6]).forEach((v,i)=>near(v,[0,-1,0][i]));
}
{const click=makeDiePlan({q:dieLanding(0),x:0,y:0},0,()=>.5,116,18,{direction:1,strength:.5}),flick=makeDiePlan({q:dieLanding(0),x:0,y:0},0,()=>.5,116,18,{direction:1,strength:.5,flick:true});
 assert.equal(click.contacts.length,3);assert.ok(flick.contacts.length>click.contacts.length&&flick.duration>click.duration);}
// The tray gives under each landing, less every bounce, with keyframe offsets always in order.
for(let n=0;n<120;n++){
 const plan=makeDiePlan({q:dieLanding(n%6),x:0,y:0},n%6,random,116,18,null,n%2?{edge:120}:null);
 const before=animations.length;animateDiePlan(0,plan,n%6);
 const ground=animations.slice(before).find(a=>a.frames.some(f=>'scale' in f));assert.ok(ground,'the tray reacts');
 const offsets=ground.frames.map(f=>f.offset);offsets.forEach((o,k)=>assert.ok(o>=0&&o<=1&&(k===0||o>=offsets[k-1]),'tray keyframes stay in order'));
 const depth=plan.contacts.map(c=>{const frame=ground.frames.find(f=>f.offset>c&&f.scale!=='1');return 1-Number(frame.scale.split(' ')[0]);});
 assert.ok(depth[0]>depth[1]&&depth[1]>depth[2],'each landing presses the tray less');
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
moveDieGrab(0,grab,-70);const held={...dieStates[0].pose};assert.ok(held.x<grab.x);assert.ok(held.air>=0);
tumbleDice([0],[3,b],()=>completed++,{direction:-1,strength:.7});
near(dieStates[0].running.plan.from.x,held.x);near(dieStates[0].running.plan.from.y,held.y);
beginDieGrab(0);settleDieGrab(0);const settling=dieStates[0].running;
const stillStart=sampleDiePlan(settling.plan,0);near(stillStart.y,settling.plan.from.y);
settling.animations[0].onfinish();assert.equal(dieStates[0].value,a);near(dieStates[0].pose.y,0);
const invitation={kind:'invitation',from:{q:dieLanding(a),x:0,y:0},size:104,duration:850,contacts:[]};
assert.ok(Math.abs(sampleDiePlan(invitation,.25).y)>0);near(sampleDiePlan(invitation,1).y,0);
motion.matches=true;const beforeReduced={...dieStates[0].pose};moveDieGrab(0,beforeReduced,104);assert.notEqual(dieTopFace(dieStates[0].pose.q),dieTopFace(beforeReduced.q));settleDieGrab(0);assert.equal(dieStates[0].running,null);
assert.ok(soundCalls.length>0&&soundCalls.every(call=>call[0]==='play'),'every throw schedules its contact sounds');
console.log('PASS: 96 exact face-up orientations/CSS matrices; 500 varied rigid tumbles; stable face markup; landing/rebound contacts; flicks that tap more times before landing; a tray that gives less with each bounce; 300 page strikes in mid-air that never pass the edge and land back home; mid-air retargeting; stale callbacks; completion after both land; cancellation and reduced motion.');
`,context);
