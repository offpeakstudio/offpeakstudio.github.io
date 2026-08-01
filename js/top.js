// ========================================
// ACCESS CODE
// ========================================

const pages = {

  "1996": "kp1.html",

  "1999": "radio.html",

  "2001": "visual.html",

};


// ========================================
// STATE
// ========================================

let inputCode = "";

// ========================================
// ELEMENTS
// ========================================

const codeDisplay =
  document.getElementById("codeDisplay");

const status =
  document.getElementById("status");

const terminal =
  document.querySelector(".terminal");


// ========================================
// DISPLAY
// ========================================

function updateDisplay() {

  const slots =
    codeDisplay.querySelectorAll("span");

  slots.forEach((slot, index) => {

    if (inputCode[index]) {
      slot.textContent = "●";
    } else {
      slot.textContent = "_";

    }

  });

}


// ========================================
// NUMBER BUTTON
// ========================================

document
  .querySelectorAll("[data-number]")
  .forEach(button => {

    button.addEventListener("click", () => {

      if (inputCode.length >= 4) {
        return;
      }

      inputCode +=
        button.dataset.number;

      status.textContent =
        "INPUT";

      status.className =
        "status";

      updateDisplay();

    });

  });

// ========================================
// CLEAR
// ========================================
document
  .querySelector(".key-clear")
  .addEventListener("click", () => {

    inputCode = "";

    status.textContent =
      "READY";
    status.className =
      "status";
    updateDisplay();
  });

// ========================================
// ENTER
// ========================================
document
  .querySelector(".key-enter")
  .addEventListener("click", () => {
    if (inputCode.length !== 4) {
      showError();
      return;
    }

    // 正しいコード

    if (pages[inputCode]) {

      status.textContent =
        "ACCESS GRANTED";

      status.className =
        "status success";

      setTimeout(() => {
        window.location.href =
          pages[inputCode];
      }, 700);
    }
    // 間違ったコード

    else {
      showError();
    }
  });

// ========================================
// ERROR
// ========================================
function showError() {

  status.textContent =
    "ERROR : INVALID CODE";

  status.className =
    "status error";

  terminal.classList.remove("error");

  // アニメーションを再発火

  void terminal.offsetWidth;
  terminal.classList.add("error");

  setTimeout(() => {
    inputCode = "";
    updateDisplay();
  }, 800);
}
// ========================================
// OPENING
// ========================================
window.addEventListener('load', function() {
  const openingScene = document.getElementById('opening-scene');
  const openingText = document.getElementById('opening-text');
  
  const message = "こんにちは";
  let charIndex = 0;
  const typingSpeed = 180; // 1文字あたりのタイピング速度 (ミリ秒)

  // 1. タイプライター表示処理
  function typeWriter() {
    if (charIndex < message.length) {
      openingText.textContent += message.charAt(charIndex);
      charIndex++;
      setTimeout(typeWriter, typingSpeed);
    } else {
      // 2. 文字がすべて打ち終わったら「間（タメ）」を作ってからテレビ起動！
      setTimeout(startCrtScene, 600); // 0.6秒余韻を残す
    }
  }

  // 3. CRTテレビ起動処理
  function startCrtScene() {
    // テキストを一瞬で消去して黒画面に戻す
    openingText.style.display = 'none';
    
    // クラスを付与してCRTアニメーションを走らせる
    openingScene.classList.add('crt-turn-on');
  }

  // ページ読み込み完了後、少し（0.4秒）暗転を置いてからタイピングスタート
  setTimeout(typeWriter, 400);
});

