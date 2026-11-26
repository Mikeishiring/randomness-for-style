// The opening page needs only the plain report. The pairs' reports and critiques, most of the page's weight,
// come in a second script at the end of the same file, so a slow connection shows the page without waiting
// for them. Each pair step reads them from the store; until the store arrives those reads are undefined,
// and withReport (play.js) waits for it.
const REPORT_STORE=Object.create(null),reportWaiters=[];
function receiveReports(map){Object.assign(REPORT_STORE,map);reportWaiters.splice(0).forEach(run=>run());}
for(const catalog of [EXPERIMENT,STRONGER_EXPERIMENT,NEWER_EXPERIMENT])for(const run of catalog.runs)for(const step of run.steps){
 const stored=step.stored;delete step.stored;
 for(const [field,key] of Object.entries(stored||{}))Object.defineProperty(step,field,{enumerable:true,get:()=>REPORT_STORE[key]});
}
