let diceAudioContext=null,diceNoise=null,diceSoundEnabled=true;
const diceVoices=[new Set(),new Set()],diceSoundVersions=[0,0];
try{diceSoundEnabled=localStorage.getItem('design-dice-sound')!=='off';}catch{/* File storage can be unavailable. */}
function updateSoundButton(){const button=document.querySelector('#sound-toggle');button.textContent=diceSoundEnabled?'Sound on':'Sound off';button.setAttribute('aria-pressed',String(diceSoundEnabled));}
function initDiceSound(){
 const button=document.querySelector('#sound-toggle');updateSoundButton();
 if(!(window.AudioContext||window.webkitAudioContext)){button.disabled=true;button.textContent='Sound unavailable';button.setAttribute('aria-pressed','false');return;}
 button.addEventListener('click',()=>{diceSoundEnabled=!diceSoundEnabled;updateSoundButton();try{localStorage.setItem('design-dice-sound',diceSoundEnabled?'on':'off');}catch{}
  if(diceSoundEnabled)primeDiceAudio();else [0,1].forEach(cancelDieSound);
 });
}
async function primeDiceAudio(){
 if(!diceSoundEnabled)return null;
 try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;diceAudioContext??=new Audio();if(diceAudioContext.state==='suspended')await diceAudioContext.resume();return diceAudioContext.state==='running'?diceAudioContext:null;}catch{return null;}
}
function cancelDieSound(index){
 diceSoundVersions[index]++;
 for(const voice of diceVoices[index]){for(const source of voice.sources){try{source.stop();}catch{}}voice.nodes.forEach(node=>node.disconnect());}
 diceVoices[index].clear();
}
function diceImpact(context,index,time,strength){
 if(!diceNoise){diceNoise=context.createBuffer(1,Math.ceil(context.sampleRate*.075),context.sampleRate);const samples=diceNoise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
 const noise=context.createBufferSource(),filter=context.createBiquadFilter(),noiseGain=context.createGain(),body=context.createOscillator(),bodyGain=context.createGain(),pan=context.createStereoPanner();
 const nodes=[noise,filter,noiseGain,body,bodyGain,pan],voice={sources:[noise,body],nodes};diceVoices[index].add(voice);
 noise.buffer=diceNoise;noise.playbackRate.value=.88+Math.random()*.3;filter.type='bandpass';filter.frequency.value=1500+Math.random()*1400;filter.Q.value=.9;
 noiseGain.gain.setValueAtTime(.0001,time);noiseGain.gain.linearRampToValueAtTime(.17*strength,time+.001);noiseGain.gain.exponentialRampToValueAtTime(.0001,time+.052);
 body.type='triangle';body.frequency.setValueAtTime(310+Math.random()*160,time);body.frequency.exponentialRampToValueAtTime(180,time+.035);bodyGain.gain.setValueAtTime(.055*strength,time);bodyGain.gain.exponentialRampToValueAtTime(.0001,time+.037);
 pan.pan.value=(index?1:-1)*(.25+Math.random()*.15);
 noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(pan);body.connect(bodyGain);bodyGain.connect(pan);pan.connect(context.destination);
 noise.onended=()=>{diceVoices[index].delete(voice);nodes.forEach(node=>node.disconnect());};
 noise.start(time);noise.stop(time+.07);body.start(time);body.stop(time+.045);
}
function playDiceClatter(index,plan,startedAt){
 const version=diceSoundVersions[index];
 primeDiceAudio().then(context=>{
  if(!context||!diceSoundEnabled||document.hidden||diceSoundVersions[index]!==version)return;
  const elapsed=(performance.now()-startedAt)/1000;
  plan.contacts.forEach((contact,n)=>{const delay=contact*plan.duration/1000-elapsed;if(delay>=0)diceImpact(context,index,context.currentTime+delay,[1,.58,.28][n]);});
 }).catch(()=>{/* Audio failure must not interrupt a throw. */});
}
