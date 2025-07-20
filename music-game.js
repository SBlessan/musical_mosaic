// ---------------- CONFIG & INTRO ---------------- //
const COMMANDS = [
  { cmd: "Add Piano", desc: "Add piano instrument" },
  { cmd: "Add Drums", desc: "Add drums" },
  { cmd: "Add Bass", desc: "Add bass" },
  { cmd: "Add Guitar", desc: "Add guitar" },
  { cmd: "Add Bells", desc: "Add bells" },
  { cmd: "Add Flute", desc: "Add flute" },
  { cmd: "Remove Piano", desc: "Remove piano" },
  { cmd: "Remove Drums", desc: "Remove drums" },
  { cmd: "Remove Bass", desc: "Remove bass" },
  { cmd: "Remove Guitar", desc: "Remove guitar" },
  { cmd: "Remove Bells", desc: "Remove bells" },
  { cmd: "Remove Flute", desc: "Remove flute" },
  { cmd: "Faster", desc: "Speed up the pattern" },
  { cmd: "Slower", desc: "Slow down the pattern" },
  { cmd: "Help", desc: "Hear instructions again" },
  { cmd: "Stop Recording", desc: "Finish and save your recording" },
  { cmd: "Stop Music", desc: "Finish music and save your work" }
];
const instrumentsConfig = [
  { key: "piano", label: "Piano", icon: "🎹" },
  { key: "drums", label: "Drums", icon: "🥁" },
  { key: "bass",  label: "Bass", icon: "🎸" },
  { key: "guitar", label: "Guitar", icon: "🎻" },
  { key: "bells", label: "Bells", icon: "🔔" },
  { key: "flute", label: "Flute", icon: "🎶" }
];
const instruments = {
  piano: 'triangle',
  drums: 'square',
  bass: 'sine',
  guitar: 'sawtooth',
  bells: 'triangle',
  flute: 'sine'
};

const instrumentNames = instrumentsConfig.map(i => i.label).join(", ");
const INTRO_TEXT = `Welcome to Musical Mosaic! Your instruments are: ${instrumentNames}. Click any instrument to hear its sound. Say "Help" at any time for voice guidance on all commands.`;

// -- UI references -- //
const mainPage = document.getElementById('main');
const helpPage = document.getElementById('helpPage');
const recordingPage = document.getElementById('recordingPage');
const songPage = document.getElementById('songPage');
const userAudio = document.getElementById('userAudio');
const patternStatus = document.getElementById('patternStatus');
const musicTiles = document.getElementById('musicTiles');
const recordingTimer = document.getElementById('recordingTimer');
const recIcon = document.getElementById('recIcon');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const newRecordBtn = document.getElementById('newRecordBtn');
const pauseBtn = document.getElementById('pauseBtn');
const playingStatus = document.getElementById('playingStatus');

// ----- ACCESSIBILITY & TTS ----- //
function showMain() {
  [mainPage, helpPage, recordingPage, songPage].forEach(p => p && p.classList.remove('active'));
  if (mainPage) mainPage.classList.add('active');
  if (helpPage) helpPage.style.display = "none";
  if (recordingPage) recordingPage.style.display = "none";
  if (songPage) songPage.style.display="none";
  if (mainPage) mainPage.style.display = "";
}
function showHelp() {
  [mainPage, helpPage, recordingPage, songPage].forEach(p=>p && p.classList.remove('active'));
  if (mainPage) mainPage.style.display = "none";
  if (helpPage) helpPage.style.display = "";
  if (helpPage) helpPage.classList.add('active');
  if (recordingPage) recordingPage.style.display = "none";
  if (songPage) songPage.style.display = "none";
  speak('Help page open. Here are the commands you can use.');
}
function showRecording() {
  [mainPage, helpPage, recordingPage, songPage].forEach(p=>p && p.classList.remove('active'));
  if (mainPage) mainPage.style.display = "none";
  if (helpPage) helpPage.style.display = "none";
  if (recordingPage) recordingPage.style.display = "";
  if (recordingPage) recordingPage.classList.add('active');
  if (songPage) songPage.style.display = "none";
  if (recIcon) recIcon.style.display = '';
  speak('Recording has started! Add or remove instruments by saying their names, such as "Add Guitar" or "Remove Drums". Say "Stop Recording" when you are finished.');
}
function showSong(audioURL) {
  [mainPage, helpPage, recordingPage, songPage].forEach(p=>p && p.classList.remove('active'));
  if (mainPage) mainPage.style.display = "none";
  if (helpPage) helpPage.style.display = "none";
  if (recordingPage) recordingPage.style.display = "none";
  if (songPage) songPage.style.display = "";
  if (songPage) songPage.classList.add('active');
  if (userAudio) userAudio.src = audioURL;
  speak("Your recording is ready. Listen and share your music. Record again to try new instruments!");
}

function speak(txt) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(txt);
    u.rate = 1;
    u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

// ------ INSTRUMENT DEMO BUTTONS ------ //
let audioCtx = null;
const galleryButtons = document.getElementById('galleryButtons');
galleryButtons.innerHTML = "";
instrumentsConfig.forEach(instr => {
  const btn = document.createElement('button');
  btn.className = 'instrBtn';
  btn.setAttribute('data-instr', instr.key);
  btn.setAttribute('aria-label', "Hear the " + instr.label + " sound");
  btn.innerHTML = `<span class="instrIcon">${instr.icon}</span><span class="instrLabel">${instr.label}</span>`;
  btn.onclick = ()=> {
    playSingleSample(instr.key);
    patternStatus && (patternStatus.textContent = `Played ${instr.label}!`);
    speak(`${instr.label} sound`);
  };
  galleryButtons.appendChild(btn);
});

function playSingleSample(instr) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = instruments[instr];
  osc.frequency.value = 261.63 + Math.random()*80;
  gain.gain.value = 0.2;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.49);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.49);
}

// ------ MUSIC PATTERN LOGIC ------ //
const notesFreq = {'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392,'A4':440,'B4':493.88,'C5':523.25};
let pattern = [];
let currentTempo = 110, patternInterval = null, isPlaying = true;
let activeInstruments = ["piano"]; // start with one

function generatePattern() {
  const noteKeys = Object.keys(notesFreq);
  pattern = [];
  for (let i=0;i<5;i++) { pattern.push(noteKeys[Math.floor(Math.random()*noteKeys.length)]); }
}
function showPattern() {
  musicTiles.innerHTML = "";
  for (let i=0;i<5;i++) {
    const div = document.createElement('div');
    div.className = "tile";
    div.textContent = pattern[i];
    musicTiles.appendChild(div);
  }
}
function highlightTile(i) {
  const tiles = musicTiles.querySelectorAll('.tile');
  tiles.forEach((tile, idx)=>{ tile.classList.remove('active'); });
  if (tiles[i]) tiles[i].classList.add('active');
}

function playPatternTick(noteIdx) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let now = audioCtx.currentTime;
  activeInstruments.forEach(instr => {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = instruments[instr];
    osc.frequency.value = (instr==='drums') ? 65+Math.random()*30 : notesFreq[pattern[noteIdx]];
    (instr === "drums") ? gain.gain.setValueAtTime(0.6, now) : gain.gain.setValueAtTime(0.15, now);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    let dur = (instr==='drums') ? 0.16 : 0.38;
    osc.stop(now + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    // If in record mode, also route to recorder mixed stream
    if (isRecording && destinationStream) {
      gain.disconnect();
      gain.connect(destinationStream);
    }
  });
  highlightTile(noteIdx);
}

function playPattern() {
  let idx = 0;
  if (patternInterval) clearInterval(patternInterval);
  patternInterval = setInterval(()=> {
    if (!isPlaying) return;
    playPatternTick(idx);
    idx = (idx+1)%pattern.length;
  }, 60000/currentTempo);
}

// --------- VOICE COMMANDS --------- //
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new SpeechRecognition();
rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;

function handleVoice(cmd) {
  let command = cmd.toLowerCase();
  // Instrument add/remove
  for (let {key,label} of instrumentsConfig) {
    if (command.includes("add "+label.toLowerCase())) {
      if (!activeInstruments.includes(key)) activeInstruments.push(key);
      patternStatus && (patternStatus.textContent = `Added ${label}. Instruments: `+ activeInstruments.map(k => getLabel(k)).join(", "));
      speak(`Added ${label}`);
      return;
    }
    if (command.includes("remove "+label.toLowerCase())) {
      if (activeInstruments.includes(key) && activeInstruments.length > 1) {
        activeInstruments = activeInstruments.filter(instr=>instr !== key);
        patternStatus && (patternStatus.textContent = `Removed ${label}. Instruments: `+ activeInstruments.map(k => getLabel(k)).join(", "));
        speak(`Removed ${label}`);
        return;
      } else if (activeInstruments.length === 1 && activeInstruments.includes(key)) {
        speak(`At least one instrument is required`);
        return;
      }
    }
  }
  // Global commands
  if (command.includes("faster")) {
    currentTempo = Math.min(240,currentTempo+20);
    patternStatus && (patternStatus.textContent = `Faster: ${currentTempo}BPM`);
    speak("Faster");
    return;
  }
  if (command.includes("slower")) {
    currentTempo = Math.max(40,currentTempo-20);
    patternStatus && (patternStatus.textContent = `Slower: ${currentTempo}BPM`);
    speak("Slower");
    return;
  }
  if (command.includes("help")) {
    showHelp();
    speak(INTRO_TEXT + " Here are the commands you can say.");
    return;
  }
  if (isRecording && (command.includes("stop recording") || command.includes("stop music"))) {
    stopRecording(true);
    return;
  }
}
rec.onresult = (e)=>handleVoice(e.results[0][0].transcript);
rec.onstart = ()=>{ patternStatus && (patternStatus.textContent = "(Listening...)"); };
rec.onerror = (e)=>{ patternStatus && (patternStatus.textContent = "Voice error: "+e.error); };
rec.onend = ()=>{ if(isRecording) rec.start(); else patternStatus && (patternStatus.textContent=""); };

function getLabel(key) {
  let i = instrumentsConfig.find(i=>i.key===key);
  return i ? i.label : key;
}

// ---------- RECORDING MODE ---------- //
let isRecording = false,
    recordStartTime = null,
    recordTimerInt = null,
    mediaRecorder = null,
    recordingChunks = [],
    destinationStream = null;

function updateRecordingTime() {
  let now = new Date();
  let elapsed = recordStartTime? Math.floor((now-recordStartTime)/1000):0;
  let m = Math.floor(elapsed/60), s = elapsed%60;
  if (recordingTimer) recordingTimer.textContent = `${m}:${s.toString().padStart(2,'0')}`;
}

function startRecording() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  showRecording();
  destinationStream = audioCtx.createMediaStreamDestination();
  isRecording = true;
  recordStartTime = new Date();
  if (recordingTimer) recordingTimer.textContent = "0:00";
  if (recIcon) recIcon.style.display = "";
  updateRecordingTime();
  recordingChunks = [];
  mediaRecorder = new MediaRecorder(destinationStream.stream);
  mediaRecorder.start();
  if (stopRecordBtn) stopRecordBtn.disabled=false;
  recordTimerInt = setInterval(updateRecordingTime, 700);
  mediaRecorder.ondataavailable = function(e){
    if(e.data.size>0) recordingChunks.push(e.data);
  };
  mediaRecorder.onstop = function(e){
    let blobURL = URL.createObjectURL(new Blob(recordingChunks, {type: 'audio/webm'}));
    showSong(blobURL);
    if (stopRecordBtn) stopRecordBtn.disabled=true;
    if (recIcon) recIcon.style.display = "none";
    isRecording = false;
  };
  generatePattern(); showPattern();
  patternStatus && (patternStatus.textContent = "Recording your instruments! Say 'Add' or 'Remove' plus name.");
  let idx = 0;
  if (patternInterval) clearInterval(patternInterval);
  patternInterval = setInterval(()=> {
    playPatternTickRecord(idx);
    idx = (idx+1)%pattern.length;
  }, 60000/currentTempo);
  rec.start();
}
function playPatternTickRecord(noteIdx) {
  let now = audioCtx.currentTime;
  activeInstruments.forEach(instr => {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = instruments[instr];
    osc.frequency.value = (instr==='drums') ? 65+Math.random()*30 : notesFreq[pattern[noteIdx]];
    (instr === "drums") ? gain.gain.setValueAtTime(0.6, now) : gain.gain.setValueAtTime(0.15, now);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (destinationStream) gain.connect(destinationStream);
    osc.start(now);
    let dur = (instr==='drums') ? 0.16 : 0.38;
    osc.stop(now + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  });
  highlightTile(noteIdx);
}

function stopRecording(finish) {
  clearInterval(patternInterval);
  clearInterval(recordTimerInt);
  rec.stop();
  if (stopRecordBtn) stopRecordBtn.disabled = true;
  if(mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  if(finish) {
    speak("Your song is saved! Listen to yourself. Would you like to record again?");
  }
  isRecording = false;
}

// ---------- HELP PAGE ----------- //
function makeHelp() {
  const helpCommands = document.getElementById('helpCommands');
  helpCommands.innerHTML = "";
  COMMANDS.forEach(opt=>{
    let row = document.createElement('div');
    row.className = "helpCmdRow";
    let name = document.createElement('div');
    name.className = "helpCmdName";
    name.textContent = `"${opt.cmd}"`;
    let desc = document.createElement('div');
    desc.textContent = opt.desc;
    let btn = document.createElement('button');
    btn.className = "audioplay-btn";
    btn.innerHTML = "🔉";
    btn.title = `Hear "${opt.cmd}" command`;
    btn.onclick = ()=> speak(opt.cmd);
    row.appendChild(name); row.appendChild(desc); row.appendChild(btn);
    helpCommands.appendChild(row);
  });
}
makeHelp();

// Tiles for initial page
function setupInitialTiles() {
  musicTiles.innerHTML = "";
  for(let i=0;i<5;i++){
    let d = document.createElement('div');
    d.className = "tile";
    d.textContent = "-";
    musicTiles.appendChild(d);
  }
}
setupInitialTiles();

// ------- UI HANDLERS ---------- //
document.getElementById("introAudioBtn").onclick = ()=> speak(INTRO_TEXT);
document.getElementById("recordBtn").onclick = startRecording;
if(newRecordBtn) newRecordBtn.onclick = startRecording;
if(stopRecordBtn) stopRecordBtn.onclick = ()=> stopRecording(true);
document.getElementById("helpBtn").onclick = showHelp;

if(pauseBtn) pauseBtn.onclick = function() {
  isPlaying = !isPlaying;
  if (isPlaying) {
    playingStatus.textContent = "♪ Pattern is playing";
    pauseBtn.textContent = "Pause";
  } else {
    playingStatus.textContent = "❚❚ Paused";
    pauseBtn.textContent = "Resume";
  }
};

// Main page status
if (patternStatus) patternStatus.textContent = "Pattern is playing. Click instruments or use voice to add/remove.";

// ------- PATTERN PLAYS ON APP LOAD --------- //
generatePattern();
showPattern();
activeInstruments = ["piano"];
isPlaying = true;
playPattern();

showMain();
