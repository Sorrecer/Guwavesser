const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let cw = canvas.clientWidth;
let ch = canvas.clientHeight;
let isDraw = true;
let resolution = 100
let nowWave = new Array(resolution).fill(0)
let nowAns = new Array(resolution).fill(0)
let isDrawing = false;
let xb = -1
let yb = -1

function generateWave(n)
{ 
    // Generate random y values between 0 and 1
    const y = Array.from({ length: n }, () => Math.random());

    // Generate random x values between 0 and 1, sorted, with first x = 0 and last x = 1
    let x = Array.from({ length: n - 2 }, () => Math.random());
    x = [0, ...x.sort(), 1];  // Ensure first is 0 and last is 1

    // Resolution for interpolation
    const resolution = 100;
    const yInterp = [];

    // Helper function for cubic interpolation between two points with stationary points (tangents are zero)
    function cubicHermiteStationary(p0, p1, t) {
        const t2 = t * t;
        const t3 = t2 * t;

        const h00 = 2 * t3 - 3 * t2 + 1;
        const h01 = -2 * t3 + 3 * t2;

        return h00 * p0 + h01 * p1;
    }

    // Interpolate y values between the known points using cubic Hermite interpolation with stationary points
    for (let i = 0; i < resolution; i++) {
        // Calculate the corresponding position on the x-axis (from 0 to 1)
        const xInterp = i / (resolution - 1);

        // Find the two surrounding points in the original data
        for (let j = 0; j < n - 1; j++) {
            if (x[j] <= xInterp && xInterp <= x[j + 1]) {
                // Normalize t to the range [0, 1] between the two x points
                const t = (xInterp - x[j]) / (x[j + 1] - x[j]);

                // Perform cubic Hermite interpolation with stationary points
                const yValue = cubicHermiteStationary(y[j], y[j + 1], t);
                yInterp.push(yValue);
                break;
            }
        }
    }

    return yInterp
} 

function generateSound(wave, duration, volume) // make sure volume below 0.5
{
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioCtx.sampleRate;

    const numberOfSamples = Math.ceil(sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, numberOfSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const m = wave.length;

    // Calculate the scaling factor
    const scale = (m - 1) / (numberOfSamples - 1);

    for (let i = 0; i < numberOfSamples; i++) {
        const pos = i * scale;
        const leftIndex = Math.floor(pos);
        const rightIndex = Math.ceil(pos);
        if (leftIndex === rightIndex) {
            frequency = wave[leftIndex];
        } else {
            // Otherwise, linearly interpolate between arr[leftIndex] and arr[rightIndex]
            const t = pos - leftIndex;
            const interpolatedValue = (1 - t) * wave[leftIndex] + t * wave[rightIndex];
            frequency = interpolatedValue;
        }
        const t = i / sampleRate;
        const amplitude = Math.sin(2 * Math.PI * 220 * Math.pow(2, frequency) * t) * volume;

        data[i] = amplitude;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();

    setTimeout(() => {
    source.stop();
    }, duration * 1000);
}


function drawWave(wave, color = '#ffffff')
{
    const wi = cw/(wave.length-1);
    ctx.strokeStyle = color; // Color of the line
    ctx.lineWidth = 2; // Line width

    ctx.beginPath();
    for (let i = 0; i < wave.length-1; i++) {
        ctx.moveTo(i*wi, (1-wave[i])*ch); 
        ctx.lineTo((i+1)*wi, (1-wave[i+1])*ch);
    }
    ctx.stroke();
} 

function mouseDraw(e) {
    if(isDraw) isDrawing = true;
    xb = -1
    yb = -1
}

function mouseMove(e)
{
    if (!isDrawing) return
    
    ctx.clearRect(0, 0, cw, ch);

    x = e.offsetX;
    y = e.offsetY;

    xn = Math.round(x*resolution/cw);
    yn = 1-y/ch;

    if (xb != -1){
        const dif = Math.abs(xn-xb)+1
        const dir = Math.sign(xn-xb)
        const ydiff = yn - yb;
        for(let i = 0; i < dif; i++){
            nowWave[i*dir+xb] = yb + (ydiff/dif)*i;
        }
    }
    else{
        nowWave[xn] = 1-y/ch;
    }
    yb = yn;
    xb = xn;
    drawWave(nowWave);
}

function mouseStop(e)
{
    isDrawing = false;
    xb = -1
    yb = -1
}

function calculateScore(input, wave)
{

}

function resizeCanvas()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
}

function reload(n = 3)
{
    nowAns = generateWave(n)
    ctx.clearRect(0, 0, cw, ch);
    isDraw = true;
}

function check()
{
    drawWave(nowAns, '#808080');
    isDraw = false;
}

canvas.addEventListener('mousedown', mouseDraw);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mouseup', mouseStop);
canvas.addEventListener('mouseleave', mouseStop);

// Resize the canvas when the window resizes
window.addEventListener('resize', resizeCanvas);

// Initial resize
resizeCanvas();
