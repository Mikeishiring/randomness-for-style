import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {dataset,firstPrompt,filledPrompt,ingredientPrompt,refinementPrompt,plainRefinementPrompt,ingredientsA,ingredientsB} from './prompts.mjs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const records=existsSync(new URL('recorded.json',import.meta.url))?JSON.parse(read('recorded.json')):[];
const files=readdirSync(new URL('runs/',import.meta.url)).filter(file=>file.endsWith('.html'));
for(const file of files){
 const html=read('runs/'+file);assert.ok(/<!doctype html>/i.test(html),file+': doctype');assert.ok(/<\/html>\s*$/i.test(html),file+': complete document');
 const record=records.find(item=>item.file===file);if(record)assert.equal(sha(html),record.sha256,file+': unchanged');
 for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(script[1],{filename:file});
 assert.ok(!/<(?:script|img|link|iframe)\b[^>]*(?:src|href)=["'](?:https?:|\/\/)/i.test(html),file+': external resource');
 assert.ok(!/@import\b|\bfetch\s*\(|\bXMLHttpRequest\b|AudioContext|<audio\b/i.test(html),file+': external request or audio');
 assert.ok(/synthetic/i.test(html),file+': synthetic data label');
 const compact=html.replace(/,/g,'');
 for(const number of [12480,624,...dataset.daily.flatMap(row=>[row.visits,row.signups]),...dataset.sources.flatMap(row=>[row.visits,row.signups])])assert.ok(compact.includes(String(number)),file+': missing supplied figure '+number);
 for(const source of dataset.sources)assert.ok(new RegExp(source.name,'i').test(html),file+': missing source '+source.name);
}
for(let a=0;a<ingredientsA.length;a++)for(let b=0;b<ingredientsB.length;b++){
 assert.equal(filledPrompt(a,b).replace(ingredientPrompt(a,b)+'\n\n',''),filledPrompt(null,null));
 assert.equal(read(`runs/${a}-${b}-prompt.txt`),filledPrompt(a,b));
 assert.equal(read(`runs/${a}-${b}-prompt.txt`),readFileSync(new URL(`../simple-astra/runs/${a}-${b}-prompt.txt`,import.meta.url),'utf8'));
}
assert.equal(read('refinement-prompt.txt'),refinementPrompt);
assert.equal(read('plain-refinement-prompt.txt'),plainRefinementPrompt);
assert.equal(plainRefinementPrompt.replace('the visual identity','the same two ingredients'),refinementPrompt);
assert.equal(read('runs/plain-prompt.txt'),readFileSync(new URL('../simple-astra/runs/plain-prompt.txt',import.meta.url),'utf8'));
if(!process.argv.includes('--partial')&&existsSync(new URL('protocol.json',import.meta.url))){
 const {fableCatalogs}=await import('./catalog.mjs'),{experiment,baseline}=fableCatalogs();
 assert.equal(experiment.runs.length,ingredientsA.length*ingredientsB.length);
 assert.equal(experiment.runs.filter(run=>run.steps.length===4).length,36);
 assert.equal(experiment.protocol.artifacts.length,(experiment.runs.length+1)*4);
 assert.equal(baseline.steps.length,4);
 for(const run of experiment.runs)for(const [i,step] of run.steps.entries())if(i)assert.equal(step.fullPrompt,refinementPrompt);
 for(const [i,step] of baseline.steps.entries())if(i)assert.equal(step.fullPrompt,plainRefinementPrompt);
}
console.log('PASS: '+files.length+' current outputs; saved hashes; inline script syntax; local assets; no audio; supplied figures; prompts identical to the original generation. This is a source check, not rendered verification.');
