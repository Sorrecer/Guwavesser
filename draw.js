const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let x = 0;
let y = 0;

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

function startDrawing(e) {
    isDrawing = true;
    // Clear the canvas when starting a new drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    x = e.offsetX;
    y = e.offsetY;
}

function draw(e) {
    if (!isDrawing) return;

    ctx.strokeStyle = '#ffffff'; // Color of the line
    ctx.lineWidth = 2; // Line width

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    x = e.offsetX;
    y = e.offsetY;
}

function stopDrawing() {
    isDrawing = false;
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Resize the canvas when the window resizes
window.addEventListener('resize', resizeCanvas);

// Initial resize
resizeCanvas();
