import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('dice-sound.js',import.meta.url),'utf8');
const contexts=[],nodes=[],button={textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this[k]=v}},storage=new Map();
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
 createOscillator(){return new AudioNode('body')}
 createStereoPanner(){return new AudioNode('pan')}
}
const context=vm.createContext({assert,window:{AudioContext},document:{hidden:false,querySelector:()=>button},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},performance:{now:()=>100},button,contexts,nodes});
vm.runInContext(source+'\ninitDiceSound();',context);
assert.equal(contexts.length,0);assert.equal(button.attrs['aria-pressed'],'true');
vm.runInContext('playDiceClatter(0,{contacts:[.55,.77,.91],duration:1200},100)',context);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(contexts.length,1);const noises=nodes.filter(n=>n.kind==='noise');assert.equal(noises.length,3);
for(const [i,node] of noises.entries())assert.ok(Math.abs(node.started-(10+[.55,.77,.91][i]*1.2))<1e-8);
const gains=nodes.filter(n=>n.kind==='gain'&&n.gain.events.length===3);assert.equal(gains.length,3);assert.ok(gains[0].gain.events[1].value>gains[1].gain.events[1].value&&gains[1].gain.events[1].value>gains[2].gain.events[1].value);
button.click();assert.equal(button.attrs['aria-pressed'],'false');assert.equal(storage.get('design-dice-sound'),'off');assert.ok(noises.every(n=>n.stopped==='now'));assert.ok(nodes.every(n=>n.disconnected));
const count=nodes.length;vm.runInContext('playDiceClatter(0,{contacts:[.55,.77,.91],duration:1200},100)',context);await new Promise(resolve=>setImmediate(resolve));assert.equal(nodes.length,count);
button.click();vm.runInContext('playDiceClatter(1,{contacts:[.55,.77,.91],duration:1200},100);cancelDieSound(1);',context);await new Promise(resolve=>setImmediate(resolve));assert.equal(nodes.length,count);
vm.runInContext('document.hidden=true;playDiceClatter(0,{contacts:[.55,.77,.91],duration:1200},100)',context);await new Promise(resolve=>setImmediate(resolve));assert.equal(nodes.length,count);
const muted=vm.createContext({window:{AudioContext},document:{querySelector:()=>button},localStorage:{getItem:()=> 'off'}});vm.runInContext(source+'\ninitDiceSound();',muted);assert.equal(button.attrs['aria-pressed'],'false');
console.log('PASS: no autoplay; gesture-created audio; 3 contact-synchronised fading hits; mute stops scheduled voices; stored mute; rapid cancellation and hidden-page guards. Audio graph doubles, not a listening test.');
