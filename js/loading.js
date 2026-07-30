// --- 1. HTML構造を自動的にbody直下に生成 ---
(function initLoader() {
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
})();

// --- 2. 各ページから呼び出せるコントロール用関数 ---
function showLoader(message = 'LOADING...', title = 'KARAS SYSTEM') {
  const overlay = document.getElementById('loaderOverlay');
  const status = document.getElementById('loaderStatus');
  const progressBar = document.getElementById('progressBar');
  const titleEl = overlay.querySelector('.loader-title');

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

// ページ読み込み完了時に自動で薄く消す
window.addEventListener('DOMContentLoaded', () => {
  updateProgress(100);
  setTimeout(() => {
    const overlay = document.getElementById('loaderOverlay');
    if (overlay) overlay.classList.add('hidden');
  }, 400);
});
