const canvas = document.getElementById('drawingCanvas');

const buttonPlay = document.getElementById('play');
const buttonCheck = document.getElementById('check');
const buttonReload = document.getElementById('reload');
const sliderResolution = document.getElementById('resolution');
const sliderPoints = document.getElementById('points');
const optionPitch = document.getElementById('pitch');
const optionEasing = document.getElementById('easing');
const optionLine = document.getElementById('line');
const sliderVolume = document.getElementById('volume');
const sliderDuration = document.getElementById('duration');

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

function generateSound(wave, duration, volume) // make sure volume is below 0.5
{
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioCtx.sampleRate;

    const numberOfSamples = Math.ceil(sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, numberOfSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const m = wave.length;
    const scale = (m - 1) / (numberOfSamples - 1);

    let phase = 0; // Initialize phase
    const baseFrequency = 220; // Starting frequency

    for (let i = 0; i < numberOfSamples; i++) {
        const pos = i * scale;
        const leftIndex = Math.floor(pos);
        const rightIndex = Math.ceil(pos);
        let waveValue;

        if (leftIndex === rightIndex) {
            waveValue = wave[leftIndex];
        } else {
            // Linearly interpolate between wave[leftIndex] and wave[rightIndex]
            const t = pos - leftIndex;
            waveValue = (1 - t) * wave[leftIndex] + t * wave[rightIndex];
        }

        const frequency = baseFrequency * Math.pow(2, waveValue*3); // Exponential scaling of frequency
        const phaseIncrement = (2 * Math.PI * frequency) / sampleRate; // Increment phase smoothly based on frequency

        // Calculate amplitude based on the current phase
        const amplitude = Math.sin(phase) * volume;

        // Store the sample
        data[i] = amplitude;

        // Update the phase for the next sample
        phase += phaseIncrement;

        // Keep the phase in the range [0, 2π] to avoid overflow
        if (phase > 2 * Math.PI) {
            phase -= 2 * Math.PI;
        }
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

function calculateScore(wav, ans)
{
    let diff = 0;
    let der = 0;
    for(let i = 0; i < resolution; i++){
        diff += Math.abs(wav[i] - ans[i]);
    }
    for(let i = 0; i < resolution-1; i++){
        der += Math.abs((wav[i+1] - wav[i]) - (ans[i+1] - ans[i]));
    }
    diff /= resolution;
    der /= resolution-1;

    let scdiff = Math.exp(Math.log(0.95)*1296*diff*diff);
    let scder = 1-12*der;
    scder = scder > 0? scder:0;
    return 60*scdiff+40*scder;
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
    nowAns = generateWave(n);
    //nowAns = nowAns.fill(0.5);
    nowWave = nowWave.fill(0);
    ctx.clearRect(0, 0, cw, ch);
    isDraw = true;
}

function check()
{
    drawWave(nowAns, '#808080');
    console.log(calculateScore(nowWave, nowAns));
    isDraw = false;
}

// Event Listeners
canvas.addEventListener('mousedown', mouseDraw);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mouseup', mouseStop);
canvas.addEventListener('mouseleave', mouseStop);
buttonCheck.onclick = check;
buttonPlay.onclick = ()=>{
    generateSound(nowAns, 2, 0.2); 
    const movingLine = document.getElementById("movingLine");
    movingLine.style.animation = "moveLine 2s linear forwards";

    movingLine.addEventListener("animationend", function () {
        movingLine.style.animation = ""; // Reset animasi setelah selesai
    });
};
buttonReload.onclick = ()=>{reload()};
window.addEventListener('resize', resizeCanvas);

sliderResolution.onchange = ()=>{};
sliderPoints.onchange = ()=>{};
optionPitch.onchange = ()=>{};
optionEasing.onchange = ()=>{};
optionLine.onchange = ()=>{};
sliderVolume.onchange = ()=>{};
sliderDuration.onchange = ()=>{};

// Initial
resizeCanvas();
reload();