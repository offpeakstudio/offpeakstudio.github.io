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
const demoBtn = document.getElementById('demoBtn');
const audioFileInput = document.getElementById('audioFile');
const speedSlider = document.getElementById('speed');
const speedVal = document.getElementById('speedVal');
const resetSpeedBtn = document.getElementById('resetSpeedBtn');

const DEMO_AUDIO_PATH = 'music/demo.mp3';

// --- DEMOボタンが押されたときの処理 ---
demoBtn.addEventListener('click', async () => {
  if (isPlaying) return alert('再生を停止してから切り替えてください。');

  try {
    // 1. ローディング画面表示
    showLoader('DOWNLOADING DEMO...', 'KARAS PAD');

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const response = await fetch(DEMO_AUDIO_PATH);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // 進捗（プログレス）を計算しながら取得
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = response.body.getReader();
    let receivedLength = 0;
    let chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedLength += value.length;

      if (total) {
        // 0% 〜 70% まで進捗バーを更新
        updateProgress(Math.round((receivedLength / total) * 70));
      }
    }

    // デコード処理
    showLoader('DECODING AUDIO...', 'KARAS PAD');
    updateProgress(85);

    let allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for (let chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    audioBuffer = await audioCtx.decodeAudioData(allChunks.buffer);

    // 2. ローディング完了して画面を閉じる
    hideLoader();

  } catch (err) {
    console.error('Demo load error:', err);
    hideLoader();
    alert('デモ音源の読み込みに失敗しました。');
  }
});

// --- 手動ファイル選択時の処理 ---
audioFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (isPlaying) return alert('再生を停止してから切り替えてください。');

  try {
    // 1. ローディング画面表示
    showLoader('READING FILE...', 'KARAS PAD');
    updateProgress(30);

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const arrayBuffer = await file.arrayBuffer();
    updateProgress(65);

    showLoader('DECODING AUDIO...', 'KARAS PAD');
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // 2. ローディング完了して画面を閉じる
    hideLoader();

  } catch (err) {
    console.error('Audio decode error:', err);
    hideLoader();
    alert('ファイルの読み込みに失敗しました。');
  }
});

// --- 再生 / 停止処理 ---
playBtn.addEventListener('click', () => {
  if (!audioBuffer) return alert('音声ファイルを選択するか、「DEMO」ボタンを押してください。');

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

  if (x < 0.5) {
    filterNode.type = 'lowpass';
    const freq = Math.pow(x * 2, 2) * 19980 + 20; 
    filterNode.frequency.setTargetAtTime(freq, now, timeConstant);
  } else {
    filterNode.type = 'highpass';
    const freq = Math.pow((x - 0.5) * 2, 2) * 10000 + 20;
    filterNode.frequency.setTargetAtTime(freq, now, timeConstant);
  }

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
pad.addEventListener('pointerup', () => {});
