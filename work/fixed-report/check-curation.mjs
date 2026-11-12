import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {simpleCatalog} from '../simple-astra/catalog.mjs';
import {strongerCatalogs} from '../strong-astra/catalog.mjs';
import {fableCatalogs} from '../simple-fable/catalog.mjs';
// Editorial picks: one recommended version per pair and track, never assumed to be the last pass.
const {showcase,...curation}=JSON.parse(readFileSync(new URL('curation.json',import.meta.url),'utf8'));
const tracks={original:simpleCatalog(),stronger:strongerCatalogs().experiment,newer:fableCatalogs().experiment};
assert.ok(curation.original,'the original track is curated');
// Showcase: 5–8 original-track pairs, best first, that a first roll may land on.
assert.ok(Array.isArray(showcase)&&showcase.length>=5&&showcase.length<=8,'showcase lists 5–8 pairs');
assert.equal(new Set(showcase.map(item=>item.pair)).size,showcase.length,'showcase pairs are distinct');
for(const item of showcase){
 assert.deepEqual(Object.keys(item).sort(),['pair','reason'],'showcase entries are {pair, reason}');
 assert.ok(tracks.original.runs.some(run=>run.id===item.pair),'showcase pair exists: '+item.pair);
 assert.ok(item.reason.trim()===item.reason&&item.reason.split(/\s+/).length>=2&&item.reason.length<=60&&!/[.!?]$/.test(item.reason),'showcase reason is a short phrase: '+item.pair);
}
for(const [track,picks] of Object.entries(curation)){
 assert.ok(tracks[track],'unknown track: '+track);
 const runs=tracks[track].runs;
 assert.deepEqual(Object.keys(picks).sort(),runs.map(run=>run.id).sort(),track+': every pair once, no extras');
 for(const run of runs){
  const entry=picks[run.id],where=`${track} ${run.id}`;
  assert.deepEqual(Object.keys(entry).sort(),['note','pick','reason'],where+': pick, reason and note only');
  assert.ok(Number.isInteger(entry.pick)&&entry.pick>=1&&entry.pick<=run.steps.length,where+': pick names a recorded version');
  const words=entry.reason.trim().split(/\s+/).length;
  assert.ok(entry.reason===entry.reason.trim()&&words>=2&&words<=5&&!/[.!?]$/.test(entry.reason),where+': reason is 2–5 words');
  assert.ok(/^[A-Z0-9“‘"'+].{20,240}[.]$/.test(entry.note)&&!/[.!?]\s+[A-Z]/.test(entry.note.slice(0,-1)),where+': note is one sentence');
 }
}
const all=Object.values(curation).flatMap(picks=>Object.values(picks)),count=n=>all.filter(entry=>entry.pick===n).length;
assert.ok(count(4)<all.length,'the last pass is not the default');
console.log(`PASS: ${all.length} editorial picks across ${Object.keys(curation).join(', ')}; one-shot ${count(1)}, +1 ${count(2)}, +2 ${count(3)}, +3 ${count(4)}; ${showcase.length} showcase pairs.`);
