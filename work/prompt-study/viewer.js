const $=selector=>document.querySelector(selector);
const params=new URLSearchParams(location.search);
let selected=STUDY.pairs.find(pair=>pair.id===params.get('pair'))||STUDY.pairs[0];
let view=['start','original','stronger'].includes(params.get('show'))?params.get('show'):'compare';
const titles={start:'Starting design',original:'Original prompt',stronger:'Stronger prompt'};
const frames=new Map();
function itemFor(arm){return arm==='start'?selected.start:selected.arms[arm];}
function makeReport(arm){
 const item=itemFor(arm),section=document.createElement('section');section.className='report';
 const header=document.createElement('header'),title=document.createElement('h2'),state=document.createElement('span');title.textContent=titles[arm];state.className='result-state';state.textContent=arm==='start'?'Saved refinement 3':item.unchanged?'Unchanged':'Changed';header.append(title,state);
 const iframe=document.createElement('iframe');iframe.title=selected.label+' — '+titles[arm];iframe.setAttribute('sandbox','allow-scripts');iframe.srcdoc=item.html;
 const tools=document.createElement('div');tools.className='report-tools';
 for(const [label,text] of arm==='start'?[]:[['Prompt',item.prompt],['Critique',item.critique]]){
  const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent=label;pre.textContent=text;details.append(summary,pre);
  if(label==='Prompt'){const copy=document.createElement('button'),status=document.createElement('span');copy.type='button';copy.textContent='Copy prompt';status.className='copy-status';status.setAttribute('role','status');copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);status.textContent='Copied.';}catch{status.textContent='Select the prompt above to copy.';}});details.append(copy,status);}
  tools.append(details);
 }
 section.append(header,iframe,tools);$('#reports').append(section);return section;
}
function render(){
 const arms=view==='compare'?['original','stronger']:[view];
 for(const section of frames.values())section.hidden=true;
 arms.forEach((arm,order)=>{const key=selected.id+'-'+arm;let section=frames.get(key);if(!section){section=makeReport(arm);frames.set(key,section);}section.hidden=false;section.style.order=String(order);});
 $('#pair').value=selected.id;$('#reports').classList.toggle('comparing',view==='compare');$('#compare').setAttribute('aria-pressed',String(view==='compare'));
 document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
 $('#brief').textContent=selected.brief;
 $('#observations').hidden=!STUDY.review;
 if(STUDY.review){$('#pair-observation').textContent=STUDY.review.pairs[selected.id];$('#study-observation').textContent=STUDY.review.summary;}
 $('#status').textContent=selected.label+'. '+(view==='compare'?'Comparing the two prompts.':titles[view]+'.');
 const query=new URLSearchParams({pair:selected.id});if(view!=='compare')query.set('show',view);history.replaceState(null,'',location.pathname+'?'+query);
}
for(const pair of STUDY.pairs){const option=document.createElement('option');option.value=pair.id;option.textContent=pair.label;$('#pair').append(option);}
$('#pair').addEventListener('change',event=>{selected=STUDY.pairs.find(pair=>pair.id===event.target.value);render();});
$('#compare').addEventListener('click',()=>{view=view==='compare'?'stronger':'compare';render();});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view;render();}));
for(const key of ['design','selection','limits'])$('#'+key).textContent=STUDY.protocol[key];
render();
