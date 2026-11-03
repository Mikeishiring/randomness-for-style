import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {dataset,firstPrompt,filledPrompt,ingredientPrompt,refinementPrompt,pilotIds,ingredientsA,ingredientsB} from './prompts.mjs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const sha=text=>createHash('sha256').update(text).digest('hex');
const records=JSON.parse(read('recorded.json'));
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
 assert.ok(!/chart|table|typograph|palette|layout|card|trend/i.test(firstPrompt(a,b)));
}
assert.equal(read('refinement-prompt.txt'),refinementPrompt);
if(!process.argv.includes('--partial')&&existsSync(new URL('protocol.json',import.meta.url))){
 const {simpleCatalog}=await import('./catalog.mjs'),catalog=simpleCatalog();assert.equal(catalog.runs.length,ingredientsA.length*ingredientsB.length);assert.equal(catalog.runs.filter(run=>run.steps.length===4).length,36);assert.equal(catalog.protocol.artifacts.length,catalog.runs.length*4+1);
 assert.deepEqual(catalog.protocol.pilotIds,pilotIds);
 for(const run of catalog.runs)for(const [i,step] of run.steps.entries())if(i){assert.equal(step.fullPrompt,refinementPrompt);assert.equal(catalog.protocol.artifacts.find(record=>record.file===step.file).predecessorSha256,run.steps[i-1].sha256);}
}
if(existsSync(new URL('plain-protocol.json',import.meta.url))){
 const {plainCatalog}=await import('./plain-catalog.mjs'),plain=plainCatalog();assert.equal(plain.steps.length,4);
 assert.equal(plain.steps[0].html,read('runs/plain-1.html'));
 assert.equal(plain.protocol.refinementPrompt.replace('the visual identity','the same two ingredients'),refinementPrompt);
 for(let i=1;i<4;i++){assert.equal(plain.steps[i].fullPrompt,plain.protocol.refinementPrompt);assert.equal(plain.protocol.artifacts[i].predecessorSha256,plain.steps[i-1].sha256);}
}
console.log('PASS: '+files.length+' current outputs; saved hashes; inline script syntax; local assets; no audio; supplied figures; plain/ingredient prompt parity. This is a source check, not rendered verification.');
