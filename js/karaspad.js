     let audioCtx;
let sourceNode;
let audioBuffer;
let isPlaying = false;

// エフェクトノード群
let filterNode;
let delayNode;
let feedbackGain;
let masterGain;
let lfoNode, lfoGain;

const pad = document.getElementById('pad');
const pointer = document.getElementById('pointer');
const playBtn = document.getElementById('playBtn');
const audioFileInput = document.getElementById('audioFile');
const speedSlider = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const resetSpeedBtn = document.getElementById('resetSpeedBtn');

// --- 追加機能: 初期デモ音源の自動ロード htmlから見て---
const DEMO_AUDIO_PATH = 'music/demo.mp3';

async function loadDemoAudio() {
  try {
    playBtn.textContent = 'LOADING DEMO...';
    playBtn.disabled = true;

    // 初期起動時に Web Audio Context を作成
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // demo.mp3 を取得してデコード
    const response = await fetch(DEMO_AUDIO_PATH);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    playBtn.textContent = 'PLAY';
    playBtn.disabled = false;
    console.log('Demo audio loaded successfully!');
  } catch (err) {
    console.warn('Demo audio load failed (or local file policy restriction):', err);
    // デモ音源の読み込みに失敗した場合は、通常待機状態に戻す
    playBtn.textContent = 'PLAY';
    playBtn.disabled = false;
  }
}

// ページ読み込み完了時にデモ音源を取得
window.addEventListener('DOMContentLoaded', loadDemoAudio);

// --- 手動ファイル選択時の処理 ---
audioFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  try {
    playBtn.textContent = 'LOADING...';
    playBtn.disabled = true;

    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    playBtn.textContent = 'PLAY';
    playBtn.disabled = false;
  } catch (err) {
    console.error('Audio decode error:', err);
    alert('ファイルの読み込みに失敗しました。');
    playBtn.textContent = 'PLAY';
    playBtn.disabled = false;
  }
});

// --- 再生 / 停止処理 ---
playBtn.addEventListener('click', () => {
  if (!audioBuffer) return alert('音声ファイルが読み込まれていません。');

  // 【STOP処理】
  if (isPlaying) {
    if (sourceNode) {
      sourceNode.stop();
      sourceNode.disconnect();
    }
    if (lfoNode) {
      lfoNode.stop();
      lfoNode.disconnect();
    }
    
    isPlaying = false;
    
    playBtn.textContent = 'PLAY';
    playBtn.style.background = '#00f0ff';
    playBtn.style.color = '#000000'; 
    pointer.style.display = 'none';
    return;
  }

  // 【PLAY処理】
  // ブラウザの自動再生規制を解除するため、ユーザーのクリックで Context を resume する
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // ノード作成
  sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.loop = true;
  sourceNode.playbackRate.value = parseFloat(speedSlider.value);

  filterNode = audioCtx.createBiquadFilter();
  delayNode = audioCtx.createDelay(1.0);
  feedbackGain = audioCtx.createGain();
  masterGain = audioCtx.createGain();

  // フランジャー用 LFO
  lfoNode = audioCtx.createOscillator();
  lfoGain = audioCtx.createGain();
  lfoNode.frequency.value = 0.5;
  lfoGain.gain.value = 0;
  
  lfoNode.connect(lfoGain);
  lfoGain.connect(delayNode.delayTime);
  lfoNode.start();

  // 初期値設定
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 20000;
  delayNode.delayTime.value = 0.001;
  feedbackGain.gain.value = 0.3;
  masterGain.gain.value = 0.7;

  // 接続処理
  sourceNode.connect(filterNode);
  filterNode.connect(delayNode);
  
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);

  filterNode.connect(masterGain);
  delayNode.connect(masterGain);
  
  masterGain.connect(audioCtx.destination);

  sourceNode.start(0);
  isPlaying = true;
  
  playBtn.textContent = 'STOP';
  playBtn.style.background = '#ff007f';
  playBtn.style.color = '#ffffff';

  setCenterPosition();
});

resetSpeedBtn.addEventListener('click', () => {
  speedSlider.value = 1.0;
  speedVal.textContent = '1.00';
  if (sourceNode) {
    sourceNode.playbackRate.value = 1.0;
  }
});

speedSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  speedVal.textContent = val.toFixed(2);
  if (sourceNode) {
    sourceNode.playbackRate.value = val;
  }
});

// --- PadのXYエフェクト処理 ---
function updateEffects(x, y) {
  if (!isPlaying) return;

  const now = audioCtx.currentTime;
  const timeConstant = 0.03;

  // 【X軸: フィルター】
  if (x < 0.5) {
    filterNode.type = 'lowpass';
    const freq = Math.pow(x * 2, 2) * 19980 + 20; 
    filterNode.frequency.setTargetAtTime(freq, now, timeConstant);
  } else {
    filterNode.type = 'highpass';
    const freq = Math.pow((x - 0.5) * 2, 2) * 10000 + 20;
    filterNode.frequency.setTargetAtTime(freq, now, timeConstant);
  }

  // 【Y軸: 上半分=フランジャー / 下半分=簡易ディレイ / 中央=ニュートラル】
  if (y < 0.5) {
    const amount = (0.5 - y) * 2; 
    lfoGain.gain.setTargetAtTime(amount * 0.003, now, timeConstant);
    lfoNode.frequency.setTargetAtTime(amount * 6 + 0.2, now, timeConstant);
    
    delayNode.delayTime.setTargetAtTime(0.005, now, timeConstant);
  } else {
    lfoGain.gain.setTargetAtTime(0, now, timeConstant);
    
    const delayTime = (y - 0.5) * 2 * 0.45;
    delayNode.delayTime.setTargetAtTime(delayTime, now, timeConstant);
  }
}

function setCenterPosition() {
  pointer.style.display = 'block';
  pointer.style.left = `50%`;
  pointer.style.top = `50%`;
  updateEffects(0.5, 0.5);
}

function handlePointer(e) {
  if (!isPlaying) return;
  
  const rect = pad.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  let x = (clientX - rect.left) / rect.width;
  let y = (clientY - rect.top) / rect.height;

  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));

  pointer.style.display = 'block';
  pointer.style.left = `${x * 100}%`;
  pointer.style.top = `${y * 100}%`;

  updateEffects(x, y);
}

pad.addEventListener('pointerdown', (e) => {
  pad.setPointerCapture(e.pointerId);
  handlePointer(e);
});
pad.addEventListener('pointermove', (e) => {
  if (e.buttons > 0 || e.touches) handlePointer(e);
});
pad.addEventListener('pointerup', () => {
  // 指を離してもポインター位置を固定維持
});
