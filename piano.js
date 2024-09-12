const canvas = document.getElementById("pianoRollCanvas");
const ctx = canvas.getContext("2d");
const pianoKeysDiv = document.getElementById("pianoKeys");
const keyNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

let canvasWidth = 1200;
let canvasHeight = 600;
let keyWidth = 60;
let keyHeight = 30;
let numKeys = 88; // Example for full piano

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function drawPianoRoll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const numColumns = Math.floor(canvas.width / keyWidth);
  const numRows = Math.floor(canvas.height / keyHeight);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;

  // Draw vertical lines
  for (let i = 0; i <= numColumns; i++) {
    ctx.beginPath();
    ctx.moveTo(i * keyWidth, 0);
    ctx.lineTo(i * keyWidth, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let i = 0; i <= numRows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * keyHeight);
    ctx.lineTo(canvas.width, i * keyHeight);
    ctx.stroke();
  }
}

function drawPianoKeys() {
  pianoKeysDiv.innerHTML = "";
  for (let i = 0; i < numKeys; i++) {
    const key = document.createElement("div");
    key.className = "piano-key";
    key.textContent = keyNames[i % 12];
    pianoKeysDiv.appendChild(key);
  }
}

function init() {
  resizeCanvas();
  drawPianoRoll();
  drawPianoKeys();
}

// Resize canvas on window resize
window.addEventListener("resize", resizeCanvas);

// Initial setup
init();
