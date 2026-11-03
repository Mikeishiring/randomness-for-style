// A saved walkthrough: brief alone → roll → ingredient one-shot → three refinements.
// The roll is real; the reports are recorded. Manual input invalidates pending work.
function createRefinementPlayback({showPlain,rollIngredients,setStage,onPlaying,onBeat,canPlay,delay=2200,schedule=setTimeout,unschedule=clearTimeout}){
 let timer=null,phase='idle',beat=0,rolling=false,run=0,ticket=0;
 function clear(){ticket++;if(timer!==null)unschedule(timer);timer=null;}
 function state(next){phase=next;onPlaying(phase==='playing',phase);}
 function stop(){clear();run++;rolling=false;if(phase!=='idle')state('idle');}
 function pause(){if(phase==='playing'){clear();state('paused');}}
 function queue(){
  if(phase!=='playing'||rolling)return;
  const token=ticket;
  timer=schedule(()=>{
   if(token!==ticket||phase!=='playing')return;
   timer=null;
   if(!canPlay()){pause();return;}
   advance();
  },delay);
 }
 function advance(){
  if(rolling||phase==='idle')return;
  clear();
  if(beat===4){state('complete');return;}
  beat++;
  if(beat===1){
   rolling=true;const token=run;onBeat('roll');
   rollIngredients(()=>{
    if(token!==run||phase==='idle')return;
    rolling=false;setStage(1);onBeat(1);queue();
   });
  }else{setStage(beat);onBeat(beat);queue();}
 }
 function start({restart=true}={}){
  clear();if(!canPlay()){stop();return;}
  if(restart){run++;beat=0;rolling=false;showPlain();}
  state('playing');onBeat(rolling?'roll':beat);queue();
 }
 return {start,stop,pause,advance,get running(){return phase==='playing';},get phase(){return phase;},get beat(){return beat;},toggle(){if(phase==='playing')pause();else start({restart:phase!=='paused'});}};
}
