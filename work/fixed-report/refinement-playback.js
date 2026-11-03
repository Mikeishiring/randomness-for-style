// A finite tour of saved outputs. Stopping holds the current stage; it never rerolls.
function createRefinementPlayback({getStage,setStage,onPlaying,canPlay,delay=2200,schedule=setTimeout,unschedule=clearTimeout}){
 let timer=null,running=false;
 function stop(){if(timer!==null)unschedule(timer);timer=null;if(running){running=false;onPlaying(false);}}
 function tick(){
  timer=null;
  if(!running||!canPlay()){stop();return;}
  setStage(getStage()+1);
  if(getStage()>=4)stop();else timer=schedule(tick,delay);
 }
 function start({restart=false}={}){
  stop();if(!canPlay())return;
  if(restart||getStage()>=4)setStage(1);
  running=true;onPlaying(true);timer=schedule(tick,delay);
 }
 return {start,stop,get running(){return running;},toggle(){if(running)stop();else start();}};
}
