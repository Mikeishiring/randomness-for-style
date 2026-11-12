import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const root=new URL('../../',import.meta.url);
const source=readFileSync(new URL('outputs/index.html',root),'utf8');
// The public page is the complete current experiment, with no links to earlier studies.
const html=source;
const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const payload=script.slice(0,script.indexOf('// All six ingredients'));
const context=vm.createContext({});
vm.runInContext(payload+';globalThis.experiment={EXPERIMENT,BASELINE,STRONGER_EXPERIMENT,STRONGER_BASELINE,NEWER_EXPERIMENT,NEWER_BASELINE};',context);
const publicText=html+'\n'+JSON.stringify(context.experiment);
const identifyingPatterns=[
 /\b(?:micha(?:el)?|mike|williamson)\b|mikeishiring|michaelwilliamsonthe/i,
 /file:\/\/\/|[A-Z]:[\\/](?:Users|home)|\.codex[\\/]|Documents[\\/]Codex/i,
 /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
 /\b(?:mailto:|tel:)|name=["']author["']/i,
 /01a1882f-71c2-7d22-a56d-48b4e7d3c3d0/i
];
for(const pattern of identifyingPatterns)assert.ok(!pattern.test(publicText),'Identifying detail found; publication stopped.');
assert.ok(!/\b(?:Astra|Codex|Fable|Claude)\b/.test(publicText),'Model branding found in public page.');
assert.ok(!/previous-experiment\.html|earlier-dice\.html/.test(html));
assert.equal(context.experiment.EXPERIMENT.runs.length,36);
assert.equal(context.experiment.STRONGER_EXPERIMENT.runs.length,36);
assert.ok(context.experiment.STRONGER_EXPERIMENT.runs.every(run=>run.steps.length===4));
assert.equal(context.experiment.NEWER_EXPERIMENT.runs.length,36);
assert.ok(context.experiment.NEWER_EXPERIMENT.runs.every(run=>run.steps.length===4));
assert.equal(context.experiment.NEWER_BASELINE.steps.length,4);
assert.ok(html.includes('<title>Randomness for Style</title>'));
new vm.Script(script);
mkdirSync(new URL('site/dist/',root),{recursive:true});
writeFileSync(new URL('site/dist/index.html',root),html);
console.log('Public build ready: 36 combinations; no personal names, contact details, local paths, author metadata or archive links in page and export payload.');
