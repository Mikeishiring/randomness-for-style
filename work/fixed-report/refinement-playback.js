// Replay saved results, never simulate generation. Manual input cancels the tour;
// pausing holds its explanation, and completion leaves the final result in place.
function createRefinementPlayback({getStage,setStage,onPlaying,onBeat=()=>{},canPlay,delay=1800,firstDelay=1200,schedule=setTimeout,unschedule=clearTimeout}){
 let timer=null,phase='idle',epoch=0;
 function clear(){epoch++;if(timer!==null)unschedule(timer);timer=null;}
 function state(next){phase=next;onPlaying(phase==='playing',phase);}
 function stop(){clear();if(phase!=='idle')state('idle');}
 function pause(){if(phase==='playing'){clear();state('paused');}}
 function queue(){
  const token=epoch;
  timer=schedule(()=>{
   if(token!==epoch||phase!=='playing')return;
   timer=null;
   if(!canPlay()){pause();return;}
   if(getStage()>=4){state('complete');return;}
   setStage(getStage()+1);onBeat(getStage());queue();
  },getStage()===1?firstDelay:delay);
 }
 function start({restart=true}={}){
  clear();if(!canPlay()){stop();return;}
  if(restart)setStage(1);
  state('playing');onBeat(getStage());queue();
 }
 return {start,stop,pause,get running(){return phase==='playing';},get phase(){return phase;},toggle(){if(phase==='playing')pause();else start({restart:phase!=='paused'});}};
}
