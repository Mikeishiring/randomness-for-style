import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const button={dataset:{},style:{values:{},setProperty(key,value){this.values[key]=value;}},events:{},captured:new Set(),addEventListener(key,fn){this.events[key]=fn;},removeAttribute(key){delete this.dataset[key.replace('data-','')];},setPointerCapture(id){this.captured.add(id);},hasPointerCapture(id){return this.captured.has(id);},releasePointerCapture(id){this.captured.delete(id);},getBoundingClientRect(){return {left:0,top:0,width:160,height:220};},querySelector(){return {clientWidth:94}}};
const motion={matches:false,handlers:[],addEventListener(_key,fn){this.handlers.push(fn);}},fine={...motion,matches:true,handlers:[]},calls=[],choices=[],moves=[],settles=[],document={hidden:false,addEventListener(_key,fn){this.onHidden=fn;}};
let now=1000,grabs=0,shown=null;
const context=vm.createContext({beginDieGrab(){grabs++;return {x:0,y:0,q:[0,0,0,1]}},dieShowsFace:(_index,face)=>face===shown,moveDieGrab(...args){moves.push(args)},settleDieGrab(...args){settles.push(args)},dieTopFace(){return 3},chooseDieFace(...args){choices.push(args)},button,document,performance:{now:()=>now},diceMotion:motion,matchMedia:()=>fine,dieStates:[{running:null,pose:{q:[0,0,0,1]}},{running:null}],roll:(...args)=>calls.push(args)});
vm.runInContext(readFileSync(new URL('dice-interaction.js',import.meta.url),'utf8')+'\nbindDieInteraction(button,0);',context);
const event=(values={})=>({isPrimary:true,button:0,pointerId:1,pointerType:'mouse',clientX:80,clientY:100,detail:1,preventDefault(){this.prevented=true;},...values});
const send=(type,values,elapsed=0)=>{now+=elapsed;const e=event(values);button.events[type](e);return e;};
send('pointerenter');send('pointermove',{clientX:120,clientY:70});assert.equal(button.dataset.hover,'true');assert.notEqual(button.style.values['--touch-z'],'0deg');assert.ok(parseFloat(button.style.values['--touch-y'])>4&&parseFloat(button.style.values['--touch-x'])>3,'the die turns toward the pointer');assert.notEqual(button.style.values['--lean-x'],undefined);assert.equal(calls.length,0);
send('pointerdown');assert.ok(button.captured.has(1));assert.equal(grabs,0,'a press alone does not take hold of the die, so one in the air keeps moving');send('pointerup');send('click');assert.equal(calls.length,1);assert.equal(grabs,0);assert.equal(button.captured.size,0);
// A slow two-axis turn chooses the upper face, once, without a random roll.
send('pointerdown');send('pointermove',{clientX:140,clientY:150},400);send('pointerup',{clientX:140,clientY:150},150);send('click');
assert.equal(calls.length,1);assert.deepEqual(choices,[[0,3]]);assert.deepEqual(moves.at(-1).slice(2),[60,50]);
// Equal distances produce different outcomes based on release speed.
send('pointerdown');const movement=send('pointermove',{clientX:140},30);assert.equal(movement.prevented,true);send('pointerup',{clientX:140},5);send('click');
assert.equal(calls.length,2);assert.equal(calls[1][0],0);assert.equal(calls[1][1].direction,1);assert.equal(calls[1][1].flick,true,'a throw from the hand is a flick');assert.ok(calls[1][1].strength>0);
const softer=calls[1][1].strength;
send('pointerdown');send('pointermove',{clientX:140},10);send('pointerup',{clientX:140},5);send('click');assert.ok(calls[2][1].strength>softer);
// Fast vertical touch throws use the vertical rotation axis.
send('pointerdown',{pointerType:'touch'});send('pointermove',{pointerType:'touch',clientY:40},25);send('pointerup',{pointerType:'touch',clientY:40},5);
assert.ok(calls.at(-1)[1].axis[0]>0);assert.equal(calls.at(-1)[1].axis[2],0);send('click');
// Recent reversal sets throw direction, not total distance from the grab.
send('pointerdown');send('pointermove',{clientX:150},300);send('pointermove',{clientX:120},20);send('pointerup',{clientX:100},10);send('click');assert.equal(calls.at(-1)[1].direction,-1);
// Letting go with the face the die already shows chose nothing, so it still rolls: a click that slipped rolls
// like a click, and a swipe too gentle to be a flick is thrown from the hand.
shown=3;const beforeSlip=calls.length,slipChoices=choices.length,slipGrabs=grabs;
send('pointerdown');send('pointermove',{clientX:90,clientY:104},60);assert.equal(grabs,slipGrabs+1,'the drag picks the die up');send('pointerup',{clientX:90,clientY:104},140);send('click');
assert.equal(calls.length,beforeSlip+1);assert.equal(calls.at(-1)[1],undefined,'a slipped click rolls like a click');assert.equal(choices.length,slipChoices);
send('pointerdown');send('pointermove',{clientX:110},60);send('pointermove',{clientX:125},40);send('pointerup',{clientX:130},20);send('click');
const gentle=calls.at(-1)[1];assert.equal(calls.length,beforeSlip+2);assert.equal(gentle.guided,true);assert.equal(gentle.flick,undefined,'a gentle swipe is a roll, not a flick');assert.equal(gentle.direction,1);assert.ok(gentle.velocity[0]>0);assert.equal(choices.length,slipChoices);shown=null;
// Holding after a fast movement chooses instead of throwing.
const priorCalls=calls.length;send('pointerdown');send('pointermove',{clientX:150},20);send('pointerup',{clientX:150},160);send('click');assert.equal(calls.length,priorCalls);assert.equal(choices.length,2);
// Escape, capture loss and multiple pointers never commit.
const priorChoices=choices.length;
send('pointerdown');send('pointermove',{clientX:20},100);send('keydown',{key:'Escape'});send('pointerup',{clientX:20},900);send('click');assert.equal(choices.length,priorChoices);assert.equal(calls.length,priorCalls);
send('pointerdown');send('pointermove',{clientX:20},100);send('blur');send('pointerup',{clientX:20},900);send('click');assert.equal(calls.length,priorCalls);
send('pointerdown');send('pointerup',{pointerId:2,clientX:20});assert.equal(button.dataset.pressed,'true');send('pointercancel');send('click');
send('pointerdown');send('lostpointercapture');assert.equal(button.captured.size,0);send('click');assert.equal(calls.length,priorCalls);
send('pointerdown');send('pointerup',{clientX:170,clientY:110});send('click');assert.equal(calls.length,priorCalls);
// Arrow keys deliberately turn; Enter remains a random roll.
send('keydown',{key:'ArrowRight'});assert.equal(choices.length,priorChoices+1);assert.deepEqual(moves.at(-1).slice(2),[94,0]);
send('keydown',{key:'ArrowUp'});assert.deepEqual(moves.at(-1).slice(2),[0,-94]);
send('click',{detail:0});assert.equal(calls.length,priorCalls+1);
motion.matches=true;motion.handlers.forEach(fn=>fn());send('pointerdown');send('pointermove',{clientX:20},300);send('pointerup',{clientX:20},150);assert.equal(choices.length,priorChoices+3);
send('pointerdown');document.hidden=true;document.onHidden();assert.equal(button.dataset.pressed,undefined);assert.equal(button.captured.size,0);assert.ok(settles.length>0);
console.log('PASS: click; a press that leaves a flying die alone; slow two-axis choice; an unchanged face that rolls instead of doing nothing; velocity/intensity and reversal; vertical touch gesture; hold-to-choose; no duplicate activation; capture/cancel/Escape/outside release; keyboard; reduced-motion action; hidden cleanup. Event doubles, not a real-device gesture test.');
