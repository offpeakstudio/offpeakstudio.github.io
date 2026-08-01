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
