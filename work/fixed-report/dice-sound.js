// Synthesised, so nothing loads and no two throws sound alike. Each die has its own material:
// the ink die is a bright resin click, the vermilion die a warmer, woodier knock. Every throw
// varies pitch, brightness and the small rattles between landings. A die striking the page gives
// a dull board knock; the page change that follows makes a short paper swish. On phones that
// support it, each contact also gives a short vibration. Nothing sounds until a visitor acts.
let diceAudioContext=null,diceNoise=null,diceSoundEnabled=true;
const diceVoices=[new Set(),new Set(),new Set()],diceSoundVersions=[0,0,0],diceBuzzTimers=[new Set(),new Set(),new Set()];
const DIE_MATERIALS=[
 {click:3400,body:1250,bodyQ:1.5,ring:1880,ringWave:'triangle',thump:118},
 {click:2600,body:880,bodyQ:1.15,ring:1320,ringWave:'sine',thump:96}
];
try{diceSoundEnabled=localStorage.getItem('design-dice-sound')!=='off';}catch{/* File storage can be unavailable. */}
function updateSoundButton(){const button=document.querySelector('#sound-toggle');button.textContent=diceSoundEnabled?'Sound on':'Sound off';button.setAttribute('aria-pressed',String(diceSoundEnabled));}
function initDiceSound(){
 const button=document.querySelector('#sound-toggle');updateSoundButton();
 if(!(window.AudioContext||window.webkitAudioContext)){button.disabled=true;button.textContent='Sound unavailable';button.setAttribute('aria-pressed','false');return;}
 button.addEventListener('click',()=>{diceSoundEnabled=!diceSoundEnabled;updateSoundButton();try{localStorage.setItem('design-dice-sound',diceSoundEnabled?'on':'off');}catch{}
  if(diceSoundEnabled)primeDiceAudio();else [0,1,2].forEach(cancelDieSound);
 });
}
async function primeDiceAudio(){
 if(!diceSoundEnabled)return null;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;diceAudioContext??=new Audio();if(diceAudioContext.state==='suspended')await diceAudioContext.resume();return diceAudioContext.state==='running'?diceAudioContext:null;}catch{return null;}
}
// Channel 0 and 1 are the dice; channel 2 is the page.
function cancelDieSound(index){
 diceSoundVersions[index]++;
 for(const voice of diceVoices[index]){for(const source of voice.sources){try{source.stop();}catch{}}voice.nodes.forEach(node=>node.disconnect());}
 diceVoices[index].clear();
 diceBuzzTimers[index].forEach(timer=>clearTimeout(timer));diceBuzzTimers[index].clear();
}
const soundBetween=(min,max)=>min+(max-min)*Math.random();
function diceNoiseBuffer(context){
 if(!diceNoise){diceNoise=context.createBuffer(1,Math.ceil(context.sampleRate*.6),context.sampleRate);const samples=diceNoise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
 return diceNoise;
}
// A small room: a short, soft tail shared by every voice, so hits sound like they happen on a table
// in a space rather than inside the speaker.
let diceRoom=null;
function diceRoomInput(context){
 if(diceRoom?.context===context)return diceRoom.input;
 const convolver=context.createConvolver(),wet=context.createGain(),length=Math.ceil(context.sampleRate*.3),impulse=context.createBuffer(2,length,context.sampleRate);
 for(let channel=0;channel<2;channel++){const samples=impulse.getChannelData(channel);for(let i=0;i<length;i++)samples[i]=(Math.random()*2-1)*(1-i/length)**3.4;}
 convolver.buffer=impulse;wet.gain.value=.13;convolver.connect(wet);wet.connect(context.destination);
 diceRoom={context,input:convolver};return convolver;
}
// One voice: a set of sources into a shared panner, released together.
function diceVoice(context,index,pan){
 const panner=context.createStereoPanner(),voice={sources:[],nodes:[panner],out:panner,end:0};
 panner.pan.value=Math.max(-1,Math.min(1,pan));panner.connect(context.destination);panner.connect(diceRoomInput(context));
 diceVoices[index].add(voice);return voice;
}
function finishVoice(voice,index){
 const last=voice.sources.at(-1);if(!last)return;
 last.onended=()=>{diceVoices[index].delete(voice);voice.nodes.forEach(node=>node.disconnect());};
}
// Filtered noise: clicks, knocks and paper.
function noiseBurst(context,voice,time,{type,frequency,q=1,peak,decay,rate=1,offset=0}){
 const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
 source.buffer=diceNoiseBuffer(context);source.playbackRate.value=rate;
 filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;
 gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(peak,time+.0012);gain.gain.exponentialRampToValueAtTime(.0001,time+decay);
 source.connect(filter);filter.connect(gain);gain.connect(voice.out);
 voice.sources.push(source);voice.nodes.push(source,filter,gain);
 source.start(time,offset);source.stop(time+decay+.01);
 return gain;
}
// A short pitched tone: the die's ring, or the weight of a landing.
function toneBurst(context,voice,time,{wave='sine',from,to=from,peak,decay}){
 const tone=context.createOscillator(),gain=context.createGain();
 tone.type=wave;tone.frequency.setValueAtTime(from,time);tone.frequency.exponentialRampToValueAtTime(to,time+decay);
 gain.gain.setValueAtTime(peak,time);gain.gain.exponentialRampToValueAtTime(.0001,time+decay);
 tone.connect(gain);gain.connect(voice.out);
 voice.sources.push(tone);voice.nodes.push(tone,gain);
 tone.start(time);tone.stop(time+decay+.01);
}
// A die landing on its tray. strength falls with each bounce; the first landing carries weight.
function diceImpact(context,index,time,strength,character,first=false){
 const material=DIE_MATERIALS[index],tone=character.tone,voice=diceVoice(context,index,character.pan);
 noiseBurst(context,voice,time,{type:'highpass',frequency:material.click*character.bright,q:.7,peak:.15*strength,decay:.011,rate:soundBetween(.9,1.15),offset:Math.random()*.4});
 noiseBurst(context,voice,time,{type:'bandpass',frequency:material.body*tone,q:material.bodyQ,peak:.27*strength,decay:soundBetween(.038,.055),rate:soundBetween(.85,1.1),offset:Math.random()*.4});
 toneBurst(context,voice,time,{wave:material.ringWave,from:material.ring*tone*soundBetween(.97,1.03),to:material.ring*tone*.94,peak:.04*strength,decay:.03});
 if(first)toneBurst(context,voice,time,{from:material.thump*tone,to:material.thump*.55,peak:.25*strength,decay:.09});
 finishVoice(voice,index);
 return voice;
}
// The die striking the page: a dull board knock with a little paper in it.
function diceKnock(context,index,time,strength){
 const voice=diceVoice(context,index,index?.12:-.12);
 toneBurst(context,voice,time,{from:soundBetween(200,225),to:100,peak:.34*strength,decay:.085});
 noiseBurst(context,voice,time,{type:'bandpass',frequency:soundBetween(560,720),q:.9,peak:.26*strength,decay:.06,offset:Math.random()*.4});
 noiseBurst(context,voice,time+.004,{type:'highpass',frequency:4600,q:.6,peak:.07*strength,decay:.045,offset:Math.random()*.4});
 finishVoice(voice,index);
}
function diceBuzz(index,delay,pattern){
 if(typeof navigator==='undefined'||typeof navigator.vibrate!=='function')return;
 const timer=setTimeout(()=>{diceBuzzTimers[index].delete(timer);if(diceSoundEnabled&&!document.hidden){try{navigator.vibrate(pattern);}catch{}}},Math.max(0,delay));
 diceBuzzTimers[index].add(timer);
}
// Schedules a whole throw against its plan: every landing, the rattles between them, and the strike on the page.
function playDiceClatter(index,plan,startedAt){
 const version=diceSoundVersions[index];
 // Each throw has its own character: harder throws are brighter, and no two share a pitch.
 const strength=.85+.3*Math.max(0,Math.min(1,(plan.turns-1)/2)),character={tone:soundBetween(.93,1.07),bright:soundBetween(.88,1.18),pan:(index?1:-1)*soundBetween(.22,.4)};
 const elapsedAt=()=>(performance.now()-startedAt)/1000;
 plan.contacts.forEach((contact,n)=>diceBuzz(index,contact*plan.duration-(performance.now()-startedAt),Math.max(2,Math.round(12*.6**n))));
 if(plan.knock!=null)diceBuzz(index,plan.knock*plan.duration-(performance.now()-startedAt),22);
 primeDiceAudio().then(context=>{
  if(!context||!diceSoundEnabled||document.hidden||diceSoundVersions[index]!==version)return;
  const elapsed=elapsedAt();
  plan.contacts.forEach((contact,n)=>{
   const delay=contact*plan.duration/1000-elapsed;if(delay<0)return;
   const level=.58**n*strength;
   diceImpact(context,index,context.currentTime+delay,level,character,n===0);
   // An edge catching as the die tips: sometimes one rattle, sometimes two, quieter each bounce.
   if(n<2&&Math.random()<.75)diceImpact(context,index,context.currentTime+delay+soundBetween(.014,.034),level*.26,character);
   if(n<2&&Math.random()<.35)diceImpact(context,index,context.currentTime+delay+soundBetween(.045,.075),level*.13,character);
  });
  if(plan.knock!=null){const delay=plan.knock*plan.duration/1000-elapsed;if(delay>=0)diceKnock(context,index,context.currentTime+delay,strength);}
 }).catch(()=>{/* Audio failure must not interrupt a throw. */});
}
// Dragging: a click as each new face comes up, a soft lift and a set-down.
function playDieTick(index,kind='face'){
 const version=diceSoundVersions[index];
 if(kind!=='lift')diceBuzz(index,0,kind==='set'?10:5);
 primeDiceAudio().then(context=>{
  if(!context||!diceSoundEnabled||document.hidden||diceSoundVersions[index]!==version)return;
  const material=DIE_MATERIALS[index],time=context.currentTime;
  if(kind==='set')diceImpact(context,index,time,.75,{tone:1,bright:1,pan:(index?1:-1)*.3});
  else{
   const voice=diceVoice(context,index,(index?1:-1)*.3);
   noiseBurst(context,voice,time,{type:'highpass',frequency:material.click*1.2,q:.8,peak:kind==='lift'?.1:.22,decay:.009,offset:Math.random()*.4});
   toneBurst(context,voice,time,{wave:material.ringWave,from:material.ring*1.25*soundBetween(.98,1.02),peak:kind==='lift'?.025:.055,decay:.02});
   finishVoice(voice,index);
  }
 }).catch(()=>{});
}
// The page change after a strike: a soft paper swish travelling across from the struck edge.
function playReportSwish(origin,duration){
 const version=diceSoundVersions[2];
 primeDiceAudio().then(context=>{
  if(!context||!diceSoundEnabled||document.hidden||diceSoundVersions[2]!==version)return;
  const length=Math.min(.55,duration/1000*.75),time=context.currentTime,from=origin==='left'?-.55:origin==='right'?.55:0;
  const voice=diceVoice(context,2,from),source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=diceNoiseBuffer(context);filter.type='bandpass';filter.Q.value=.75;
  filter.frequency.setValueAtTime(700,time);filter.frequency.exponentialRampToValueAtTime(2600,time+length);
  gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(.05,time+length*.22);gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  voice.out.pan.setValueAtTime(from,time);voice.out.pan.linearRampToValueAtTime(-from,time+length);
  source.connect(filter);filter.connect(gain);gain.connect(voice.out);
  voice.sources.push(source);voice.nodes.push(source,filter,gain);
  source.start(time);source.stop(time+length+.01);finishVoice(voice,2);
 }).catch(()=>{});
}
// The first roll of a visit: a small pop and a quick rising chime, like a party popper.
function playCelebration(index){
 const version=diceSoundVersions[index];
 diceBuzz(index,0,[8,40,8,40,14]);
 primeDiceAudio().then(context=>{
  if(!context||!diceSoundEnabled||document.hidden||diceSoundVersions[index]!==version)return;
  const voice=diceVoice(context,index,(index?1:-1)*.25),time=context.currentTime,lift=soundBetween(.98,1.03);
  noiseBurst(context,voice,time,{type:'lowpass',frequency:1800,q:.6,peak:.16,decay:.05,offset:Math.random()*.4});
  [1046.5,1318.5,1568,2093].forEach((note,n)=>{
   const at=time+.03+n*.058;
   toneBurst(context,voice,at,{from:note*lift,peak:.05-n*.006,decay:.24});
   toneBurst(context,voice,at,{wave:'triangle',from:note*2*lift,peak:.012,decay:.12});
  });
  finishVoice(voice,index);
 }).catch(()=>{});
}
// A refinement prints over the page from the top: a soft roller pass and a light press.
function playRefineStamp(){
 const version=diceSoundVersions[2];
 diceBuzz(2,0,9);
 primeDiceAudio().then(context=>{
  if(!context||!diceSoundEnabled||document.hidden||diceSoundVersions[2]!==version)return;
  const voice=diceVoice(context,2,0),time=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),length=.26;
  source.buffer=diceNoiseBuffer(context);filter.type='bandpass';filter.Q.value=.8;
  filter.frequency.setValueAtTime(1700,time);filter.frequency.exponentialRampToValueAtTime(620,time+length);
  gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(.05,time+.03);gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  source.connect(filter);filter.connect(gain);gain.connect(voice.out);
  voice.sources.push(source);voice.nodes.push(source,filter,gain);source.start(time);source.stop(time+length+.01);
  toneBurst(context,voice,time+.012,{from:120,to:72,peak:.13,decay:.09});
  finishVoice(voice,2);
 }).catch(()=>{});
}
