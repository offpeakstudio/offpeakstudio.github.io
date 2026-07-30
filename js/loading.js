// --- 1. DOMの準備が整ったら自動的にローディング画面を構築 ---
function initLoader() {
  if (document.getElementById('loaderOverlay')) return; // 二重生成防止

  const loaderHTML = `
    <div id="loaderOverlay" class="loader-overlay">
      <div class="loader-content">
        <div class="loader-title">KARAS SYSTEM</div>
        <div class="loader-status" id="loaderStatus">INITIALIZING...</div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" id="progressBar"></div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', loaderHTML);
}

// DOM読み込み完了時、またはすでに完了していれば即実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoader);
} else {
  initLoader();
}

// --- 2. 各ページから呼び出せるコントロール用関数 ---
function showLoader(message = 'LOADING...', title = 'OFF-PEAK STUDIO') {
  initLoader(); // 念のため未生成なら作成
  const overlay = document.getElementById('loaderOverlay');
  const status = document.getElementById('loaderStatus');
  const progressBar = document.getElementById('progressBar');
  const titleEl = overlay ? overlay.querySelector('.loader-title') : null;

  if (titleEl) titleEl.textContent = title;
  if (status) status.textContent = message;
  if (progressBar) progressBar.style.width = '0%';
  if (overlay) overlay.classList.remove('hidden');
}

function updateProgress(percent) {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) progressBar.style.width = `${percent}%`;
}

function hideLoader() {
  updateProgress(100);
  setTimeout(() => {
    const overlay = document.getElementById('loaderOverlay');
    if (overlay) overlay.classList.add('hidden');
  }, 200);
}

// 画面を最初に開いたときの初期アニメーション
window.addEventListener('load', () => {
  updateProgress(100);
  setTimeout(() => {
    const overlay = document.getElementById('loaderOverlay');
    if (overlay) overlay.classList.add('hidden');
  }, 400);
});
