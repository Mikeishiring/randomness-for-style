import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const {ingredientsA,ingredientsB}=await import('../simple-astra/prompts.mjs');
assert.equal(ingredientsA.length,6);assert.equal(ingredientsB.length,6);
const html=read('../../outputs/index.html'),template=read('play.html');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);new vm.Script(scripts[0][1]);
assert.ok(!html.includes('/* APP_JS */'));assert.ok(!html.includes('/* SHELL_CSS */'));
assert.ok(/playDiceClatter/.test(html)&&/id="sound-toggle"/.test(html),'dice sound and its toggle ship');
const ids=[...template.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length);
for(const id of ids)assert.ok(html.includes('id="'+id+'"'));
const payload=scripts[0][1].slice(0,scripts[0][1].indexOf('// All six ingredients'));
const context=vm.createContext({});vm.runInContext(payload+';globalThis.built={EXPERIMENT,BASELINE,STRONGER_EXPERIMENT,STRONGER_BASELINE,NEWER_EXPERIMENT,NEWER_BASELINE};',context);
assert.equal(context.built.EXPERIMENT.runs.length,ingredientsA.length*ingredientsB.length);assert.equal(context.built.BASELINE.steps.length,4);
assert.equal(context.built.EXPERIMENT.runs.reduce((count,run)=>count+run.steps.length,0),ingredientsA.length*ingredientsB.length*4);
assert.equal(context.built.EXPERIMENT.plain.html,read('../simple-astra/runs/plain-1.html'));
assert.ok(context.built.EXPERIMENT.runs.every(run=>run.steps.length===4));
assert.equal(context.built.STRONGER_BASELINE.steps.length,4);
assert.equal(context.built.STRONGER_EXPERIMENT.runs.length,36);
for(const run of context.built.STRONGER_EXPERIMENT.runs){assert.equal(run.steps.length,4);assert.equal(run.steps[0].html,context.built.EXPERIMENT.runs.find(old=>old.id===run.id).steps[0].html);}
assert.equal(context.built.NEWER_BASELINE.steps.length,4);
assert.equal(context.built.NEWER_EXPERIMENT.runs.length,36);
assert.equal(context.built.NEWER_EXPERIMENT.plain.html,read('../simple-fable/runs/plain-1.html'));
for(const run of context.built.NEWER_EXPERIMENT.runs){assert.equal(run.steps.length,4);assert.notEqual(run.steps[0].html,context.built.EXPERIMENT.runs.find(old=>old.id===run.id).steps[0].html);assert.ok(run.steps.every(step=>step.file.startsWith('newer-')));}
console.log('PASS: self-contained bundle; 36 original, stronger and newer-model trajectories, shared prompt-track one-shots, the newer model\'s own one-shots, all three plain trajectories, syntax, unique controls, dice sound with a toggle.');
