import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('dice-sound.js',import.meta.url),'utf8');
const contexts=[],nodes=[],buzzes=[],timers=new Map(),button={textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this[k]=v}},storage=new Map();
let nextTimer=0;
const parameter=()=>({value:0,events:[],setValueAtTime(value,time){this.events.push({value,time})},linearRampToValueAtTime(value,time){this.events.push({value,time})},exponentialRampToValueAtTime(value,time){this.events.push({value,time})}});
class AudioNode{
 constructor(kind){this.kind=kind;this.gain=parameter();this.frequency=parameter();this.playbackRate=parameter();this.pan=parameter();this.Q=parameter();nodes.push(this);}
 connect(target){this.target=target;}
 disconnect(){this.disconnected=true;}
 start(time){this.started=time;}
 stop(time){this.stopped=time??'now';}
}
class AudioContext{
 constructor(){this.state='suspended';this.sampleRate=48000;this.currentTime=10;this.destination={};contexts.push(this);}
 async resume(){this.state='running';}
 createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)}}
 createBufferSource(){return new AudioNode('noise')}
 createBiquadFilter(){return new AudioNode('filter')}
 createGain(){return new AudioNode('gain')}
 createOscillator(){return new AudioNode('tone')}
 createStereoPanner(){return new AudioNode('pan')}
}
const context=vm.createContext({assert,window:{AudioContext},navigator:{vibrate:pattern=>{buzzes.push(pattern);return true}},document:{hidden:false,querySelector:()=>button},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},performance:{now:()=>100},setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,delay});return id},clearTimeout:id=>timers.delete(id),button,contexts,nodes});
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const clicks=()=>nodes.filter(n=>n.kind==='noise'&&n.target?.type==='highpass'&&n.target.frequency.value>2000&&n.target.frequency.value<4600);
const peak=noise=>noise.target.target.gain.events[1].value;
vm.runInContext(source+'\ninitDiceSound();',context);
assert.equal(contexts.length,0,'no audio before a visitor acts');assert.equal(button.attrs['aria-pressed'],'true');

// A plain throw: one landing per contact, each quieter than the last, the first with weight.
vm.runInContext('Math.random=()=>.9;playDiceClatter(0,{contacts:[.55,.77,.91],duration:1200,turns:1,knock:null},100)',context);
await settle();
assert.equal(contexts.length,1);
let landings=clicks();assert.equal(landings.length,3,'three landings, no rattles when chance is high');
landings.forEach((noise,i)=>assert.ok(Math.abs(noise.started-(10+[.55,.77,.91][i]*1.2))<1e-8,'landing '+i+' is on its contact'));
assert.ok(peak(landings[0])>peak(landings[1])&&peak(landings[1])>peak(landings[2]),'each bounce is quieter');
const thumps=nodes.filter(n=>n.kind==='tone'&&n.frequency.events[0].value<200);assert.equal(thumps.length,1,'only the first landing carries weight');
assert.deepEqual([...timers.values()].map(t=>[Math.round(t.delay)]),[[660],[924],[1092]]);
[...timers.values()].forEach(t=>t.fn());assert.deepEqual(buzzes,[12,7,4],'a short vibration on each contact, fading');
timers.clear();buzzes.length=0;

// Variation: rattles follow landings, and the two dice are different materials.
const before=nodes.length;
vm.runInContext('Math.random=()=>.1;playDiceClatter(1,{contacts:[.55,.77,.91],duration:1200,turns:3,knock:.2},100)',context);
await settle();
const fresh=nodes.slice(before),freshClicks=fresh.filter(n=>n.kind==='noise'&&n.target?.type==='highpass'&&n.target.frequency.value<4000);
assert.equal(freshClicks.length,7,'two rattles after each of the first two landings');
const bodies=fresh.filter(n=>n.kind==='filter'&&n.type==='bandpass'&&n.frequency.value>700);
assert.ok(bodies.every(f=>f.frequency.value<1100),'the vermilion die sounds lower than the ink die');
// The strike on the page: a low board knock at the knock time, and a stronger vibration.
const knock=fresh.find(n=>n.kind==='tone'&&n.frequency.events[0].value>=200&&n.frequency.events[0].value<=225);
assert.ok(knock&&Math.abs(knock.started-(10+.2*1.2))<1e-8,'the page knock lands at the strike');
assert.ok([...timers.values()].some(t=>Math.round(t.delay)===240),'the strike vibrates');

// Muting stops everything already scheduled, including pending vibrations.
button.click();assert.equal(button.attrs['aria-pressed'],'false');assert.equal(storage.get('design-dice-sound'),'off');
assert.ok(nodes.filter(n=>n.kind==='noise'||n.kind==='tone').every(n=>n.stopped==='now'));assert.ok(nodes.every(n=>n.kind==='pan'?n.disconnected:true));
assert.equal(timers.size,0,'pending vibrations are cancelled');
const count=nodes.length;
vm.runInContext('playDiceClatter(0,{contacts:[.55,.77,.91],duration:1200,turns:1,knock:null},100);playDieTick(0,"face");playReportSwish("left",640)',context);await settle();
assert.equal(nodes.length,count,'muted: nothing new sounds');
[...timers.values()].forEach(t=>t.fn());assert.equal(buzzes.length,0,'muted: nothing vibrates');timers.clear();

// Re-enabled: a cancelled throw and a hidden page stay silent.
button.click();vm.runInContext('playDiceClatter(1,{contacts:[.55,.77,.91],duration:1200,turns:1,knock:null},100);cancelDieSound(1);',context);await settle();assert.equal(nodes.length,count);
vm.runInContext('document.hidden=true;playDiceClatter(0,{contacts:[.55,.77,.91],duration:1200,turns:1,knock:null},100);playReportSwish("right",640)',context);await settle();assert.equal(nodes.length,count);
vm.runInContext('document.hidden=false',context);timers.clear();

// Dragging clicks face by face; the page swish travels across from the struck edge.
vm.runInContext('playDieTick(0,"face")',context);await settle();[...timers.values()].forEach(t=>t.fn());timers.clear();
assert.ok(nodes.length>count,'a face change ticks');assert.deepEqual(buzzes,[5]);
const swishStart=nodes.length;vm.runInContext('playReportSwish("left",640)',context);await settle();
const swish=nodes.slice(swishStart),pan=swish.find(n=>n.kind==='pan'),sweep=swish.find(n=>n.kind==='filter');
assert.ok(pan.pan.events[0].value<0&&pan.pan.events.at(-1).value>0,'the swish moves from the left edge across');
assert.ok(sweep.frequency.events.at(-1).value>sweep.frequency.events[0].value,'the swish rises');
cancelDieSoundSafe();
function cancelDieSoundSafe(){vm.runInContext('[0,1,2].forEach(cancelDieSound)',context);}

const muted=vm.createContext({window:{AudioContext},document:{querySelector:()=>button},localStorage:{getItem:()=> 'off'}});vm.runInContext(source+'\ninitDiceSound();',muted);assert.equal(button.attrs['aria-pressed'],'false');
console.log('PASS: no autoplay; per-die materials; landings on their contacts, fading, first with weight; varied rattles; page knock at the strike; drag ticks; travelling paper swish; contact vibrations; mute and cancellation stop sound and vibration; hidden-page guard; stored mute. Audio graph doubles, not a listening test.');
