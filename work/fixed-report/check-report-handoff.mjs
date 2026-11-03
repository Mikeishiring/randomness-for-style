import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const tasks=new Map();let nextTask=0,reduced=false;
const context=vm.createContext({document:{hidden:false},matchMedia:()=>({matches:reduced}),setTimeout:fn=>{const id=++nextTask;tasks.set(id,fn);return id},clearTimeout:id=>tasks.delete(id)});
vm.runInContext(readFileSync(new URL('report-handoff.js',import.meta.url),'utf8')+';this.start=handoffReport;this.stop=settleReportHandoff;this.take=takeReportCover;',context);
function section(html,loaded=true){
 const frame={srcdoc:html,dataset:{loaded:String(loaded)},events:new Map(),addEventListener(k,fn){this.events.set(k,fn)},removeEventListener(k,fn){if(this.events.get(k)===fn)this.events.delete(k)}};
 return {hidden:true,inert:false,attrs:{},classes:new Set(),animations:[],querySelector:()=>frame,setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},classList:{add(){},remove(){}},animate(){const animation={cancelled:false,cancel(){this.cancelled=true}};this.animations.push(animation);return animation}};
}
const holder={},first=section('plain'),second=section('ingredients');
context.start(holder,first,second);assert.equal(first.hidden,false);assert.equal(first.inert,true);assert.equal(first.attrs['aria-hidden'],'true');assert.equal(first.animations.length,1);
first.animations[0].onfinish();assert.equal(first.hidden,true);assert.equal(first.inert,false);assert.equal(first.attrs['aria-hidden'],undefined);
context.start(holder,first,second);const stale=first.animations.at(-1).onfinish;context.stop(holder);const third=section('refined');context.start(holder,second,third);stale();assert.equal(second.hidden,false);context.stop(holder);assert.equal(second.hidden,true);
const loading=section('new pairing',false);context.start(holder,third,loading);assert.equal(third.animations.length,0);assert.equal(tasks.size,0);assert.equal(third.hidden,false);loading.querySelector().events.get('load')();assert.equal(third.animations.length,1);context.stop(holder);
const slower=section('slow pairing',false);context.start(holder,third,slower);const pending=slower.querySelector().events.get('load');context.stop(holder);assert.equal(third.hidden,false);pending();assert.equal(third.hidden,true);assert.equal(third.animations.length,1);
// A second selection before the first loads keeps the last painted page.
const a=section('unloaded A',false),b=section('unloaded B',false);context.start(holder,first,a);const staleLoad=a.querySelector().events.get('load');const cover=context.take(holder);assert.equal(cover,first);assert.equal(first.hidden,false);context.start(holder,cover,b);staleLoad();assert.equal(first.hidden,false);assert.equal(b.querySelector().dataset.loaded,'false');b.querySelector().events.get('load')();assert.equal(context.take(holder),b);assert.equal(first.hidden,true);
reduced=true;context.start(holder,first,second);assert.equal(first.hidden,true);reduced=false;context.document.hidden=true;context.start(holder,first,second);assert.equal(first.hidden,true);context.document.hidden=false;
context.start(holder,first,section('plain'));assert.equal(first.hidden,true);
console.log('PASS: real load readiness without forced timeout, last-painted cover across rapid replacement, inert outgoing content, stale callbacks, unchanged output, hidden and reduced-motion states.');
