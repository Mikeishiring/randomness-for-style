import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
let stage=3,visible=true,nextId=0,finishRoll;
const tasks=new Map(),states=[],visited=[],beats=[];
const context=vm.createContext({setTimeout,clearTimeout});
vm.runInContext(readFileSync(new URL('refinement-playback.js',import.meta.url),'utf8')+';this.create=createRefinementPlayback;',context);
const player=context.create({showPlain:()=>{stage=0;visited.push('plain')},rollIngredients:done=>{finishRoll=done;visited.push('roll')},setStage:n=>{stage=n;visited.push(n)},canPlay:()=>visible,onPlaying:(on,phase)=>states.push(phase),onBeat:n=>beats.push(n),schedule:(fn,delay)=>{const id=++nextId;tasks.set(id,{fn,delay});return id},unschedule:id=>tasks.delete(id)});
const next=()=>{const [id,task]=tasks.entries().next().value;tasks.delete(id);assert.equal(task.delay,2200);task.fn()};
// A new walkthrough has an explicit beginning even from a shared later stage.
player.start();assert.equal(stage,0);assert.equal(player.running,true);assert.equal(tasks.size,1);
next();assert.equal(stage,0);assert.equal(tasks.size,0);assert.equal(beats.at(-1),'roll');
finishRoll();assert.equal(stage,1);assert.equal(tasks.size,1);
next();assert.equal(stage,2);next();assert.equal(stage,3);next();assert.equal(stage,4);
assert.equal(player.running,true);next();assert.equal(player.phase,'complete');assert.equal(tasks.size,0);
assert.deepEqual(visited,['plain','roll',1,2,3,4]);assert.deepEqual(beats,[0,'roll',1,2,3,4]);assert.equal(stage,4);
// Pause during the actual roll lets it settle, but never advances a refinement.
player.toggle();assert.equal(stage,0);next();player.toggle();assert.equal(player.phase,'paused');
finishRoll();assert.equal(stage,1);assert.equal(tasks.size,0);assert.equal(player.phase,'paused');
player.toggle();assert.equal(stage,1);next();assert.equal(stage,2);
visible=false;next();assert.equal(stage,2);assert.equal(player.phase,'paused');assert.equal(tasks.size,0);
player.start();assert.equal(player.running,false);visible=true;player.start();const stale=tasks.values().next().value.fn;
player.stop();player.start();stale();assert.equal(stage,0);assert.equal(tasks.size,1);
next();const cancelledRoll=finishRoll;player.stop();player.start();cancelledRoll();assert.equal(stage,0);assert.equal(tasks.size,1);
// Next gives the reader manual pacing, with no hidden timer left behind.
player.pause();player.advance();assert.equal(player.phase,'paused');assert.equal(tasks.size,0);finishRoll();assert.equal(stage,1);
player.advance();assert.equal(stage,2);assert.equal(tasks.size,0);player.advance();player.advance();assert.equal(stage,4);
player.advance();assert.equal(player.phase,'complete');player.toggle();assert.equal(stage,0);
player.stop();assert.equal(player.phase,'idle');assert.equal(tasks.size,0);
console.log('PASS: plain-first walkthrough, real roll completion, same-pair refinements, held finale, manual pacing, pause/resume during roll, stale roll/timer and visibility guards.');
