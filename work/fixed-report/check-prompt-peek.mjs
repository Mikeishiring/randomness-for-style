import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const timers=new Map();let timerId=0;
class Element{
 constructor(){this.children=[];this.events={};this.attrs={};this.hidden=true;}
 append(node){this.children.push(node);node.parent=this;}
 replaceChildren(){this.children=[];this.textContent='';}
 contains(node){return node===this||this.children.some(child=>child.contains(node));}
 addEventListener(name,fn){this.events[name]=fn;}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelector(selector){return this.children.find(child=>child.selector===selector);}
 focus(){const previous=document.activeElement;document.activeElement=this;root.events.focusin?.({relatedTarget:previous});}
}
const root=new Element(),trigger=new Element(),panel=new Element(),pin=new Element(),close=new Element();
trigger.selector='.prompt-trigger';panel.selector='.prompt-panel';pin.selector='.prompt-pin';close.selector='.prompt-close';
root.append(trigger);root.append(panel);panel.append(pin);panel.append(close);
const document={activeElement:null,events:{},createElement:()=>new Element(),addEventListener(name,fn){this.events[name]=fn;}};
const context=vm.createContext({root,document,setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}});
vm.runInContext(readFileSync(new URL('prompt-peek.js',import.meta.url),'utf8')+';bindPromptPeek(root);',context);
const flush=()=>{for(const fn of timers.values())fn();timers.clear();};
root.events.pointerenter({pointerType:'mouse'});assert.equal(panel.hidden,false);
root.events.pointerleave();flush();assert.equal(panel.hidden,true);
root.events.pointerenter({pointerType:'mouse'});trigger.events.click();assert.equal(pin.attrs['aria-pressed'],'true');
root.events.pointerleave();flush();assert.equal(panel.hidden,false);
document.events.pointerdown({target:new Element()});assert.equal(panel.hidden,true);
trigger.focus();assert.equal(panel.hidden,false);assert.equal(trigger.attrs['aria-expanded'],'true');
document.activeElement=pin;root.events.keydown({key:'Escape',preventDefault(){}});assert.equal(panel.hidden,true);assert.equal(document.activeElement,trigger);
root.events.focusout({relatedTarget:null});document.activeElement=null;flush();trigger.focus();assert.equal(panel.hidden,false);
trigger.events.click();root.events.pointerleave();flush();assert.equal(panel.hidden,false);
close.events.click();assert.equal(panel.hidden,true);
root.events.pointerenter({pointerType:'touch'});assert.equal(panel.hidden,true);trigger.events.click();assert.equal(panel.hidden,false);
// A quick leave/re-entry cannot close a new preview via the old timer.
trigger.events.click();document.activeElement=null;root.events.pointerleave();root.events.pointerenter({pointerType:'mouse'});flush();assert.equal(panel.hidden,false);
const pre=new Element();context.pre=pre;
vm.runInContext("showPrompt(pre,'Brief.\\n\\nCombine A and B.\\n\\nKeep it simple.','Combine A and B.');",context);
assert.equal(pre.children.map(child=>child.textContent).join(''),'Brief.\n\nCombine A and B.\n\nKeep it simple.');
console.log('PASS: hover preview; click pin; outside/Escape close; focus return/reopen; touch click; leave/re-entry timer; exact highlighted prompt text. Event doubles, not browser playback.');
