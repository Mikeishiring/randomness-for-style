import {readFileSync,writeFileSync,mkdirSync,copyFileSync,rmSync} from 'node:fs';
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
// The picture a shared link shows: a capture of the page itself, kept beside its source.
copyFileSync(new URL('work/fixed-report/share.jpg',root),new URL('site/dist/share.jpg',root));
// One small page per pair: it carries that pair's picture and words for link previews, and sends a visitor on to
// the experiment with whatever the link asked for. The pictures are captures of the page, kept in share/.
const site='https://randomness-for-style.vercel.app/',escapeHtml=text=>String(text).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
rmSync(new URL('site/dist/p/',root),{recursive:true,force:true});mkdirSync(new URL('site/dist/p/',root),{recursive:true});
for(const run of context.experiment.EXPERIMENT.runs){
 assert.match(run.id,/^\d-\d$/);
 const [first,second]=run.label.split(' × ').map(escapeHtml),title='Same data + '+first+' + '+second,words='One weekly report, redesigned with '+first+' and '+second+'. Throw the dice for another.',to='../?pair='+run.id;
 copyFileSync(new URL('work/fixed-report/share/'+run.id+'.jpg',root),new URL('site/dist/p/'+run.id+'.jpg',root));
 writeFileSync(new URL('site/dist/p/'+run.id+'.html',root),`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Randomness for Style</title>
<link rel="canonical" href="${site}">
<meta name="description" content="${words}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Randomness for Style">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${words}">
<meta property="og:url" content="${site}p/${run.id}.html">
<meta property="og:image" content="${site}p/${run.id}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A weekly report redesigned with ${first} and ${second}, a die on either side.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${words}">
<meta name="twitter:image" content="${site}p/${run.id}.jpg">
<script>location.replace('../'+(location.search||'?pair=${run.id}'));</script>
<noscript><meta http-equiv="refresh" content="0;url=${to}"></noscript>
</head>
<body><p><a href="${to}">${title}</a></p></body>
</html>
`);
}
console.log('Public build ready: 36 combinations; no personal names, contact details, local paths, author metadata or archive links in page and export payload.');
