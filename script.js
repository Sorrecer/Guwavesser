const canvas = document.getElementById('drawingCanvas');

const boxConfig = document.getElementById("config");

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
const expandBtn = document.getElementById("expandBtn");
const waveBox = document.getElementById("wave-box");

const displayResolution = document.getElementById("resolutionValue");
const displayPoints = document.getElementById("pointsValue");
const displayVolume = document.getElementById("volumeValue");
const displayDuration = document.getElementById("durationValue");
const statistics = document.getElementById("statistics");
const accuracy = document.getElementById("accuracy");
const configAlert = document.getElementById("configAlert");

const ctx = canvas.getContext('2d');
let cw = canvas.clientWidth;
let ch = canvas.clientHeight;
let isDraw = true;
let resolution = 100
let points = 3
let pitch = 1
let volume = 0.5
let duration = 2
let nowWave = new Array(resolution).fill(0)
let nowAns = new Array(resolution).fill(0)
let isDrawing = false;
let xb = -1
let yb = -1
let currenthi = 0;
let isExpanded = false;

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
                yInterp.push(yValue*pitch+(1-pitch)/2);
                break;
            }
        }
    }

    return yInterp
} 

function generateWaveLinear(n) {
    // Generate random y values between 0 and 1
    const y = Array.from({ length: n }, () => Math.random());

    // Generate random x values between 0 and 1, sorted, with first x = 0 and last x = 1
    let x = Array.from({ length: n - 2 }, () => Math.random());
    x = [0, ...x.sort(), 1];  // Ensure first is 0 and last is 1

    const yInterp = [];
    for (let i = 0; i < resolution; i++) {
        // Calculate the corresponding position on the x-axis (from 0 to 1)
        const xInterp = i / (resolution - 1);

        // Find the two surrounding points in the original data
        for (let j = 0; j < n - 1; j++) {
            if (x[j] <= xInterp && xInterp <= x[j + 1]) {

                // Normalize t to the range [0, 1] between the two x points
                const t = (xInterp-x[j])/(x[j+1]-x[j]) * (y[j+1]-y[j]) + y[j];

                yInterp.push(t*pitch+(1-pitch)/2);
                break;
            }
        }
    }
    return yInterp;
}

function easeGen(size, type, stiff)
{
    let val = Array.from({ length: size }, (v, i) => i / (size - 1));
    const pow = stiff/(1-stiff);
    switch (type) {
        case 0: //ease in
            return val.map((x)=>(Math.pow(x, pow)));
        case 1: //ease out
            return val.map((x)=>(1-Math.pow(1-x, pow)));
        case 2: //ease io
            return val.map((x)=>(x<0.5? Math.pow(2,pow-1)*Math.pow(x,pow) : 1-(Math.pow(-2*x+2,pow)/2)))
    }
}

function easeFunc(x, type, stiff)
{
    const pow = stiff/(1-stiff);
    switch (type) {
        case 0: //ease in
            return Math.pow(x, pow);
        case 1: //ease out
            return 1-Math.pow(1-x, pow);
        case 2: //ease io
            return x<0.5? Math.pow(2,pow-1)*Math.pow(x,pow) : 1-(Math.pow(-2*x+2,pow)/2);
    }
}

/* 
function generateWaveEasing(n)
{
    const y = Array.from({ length: n }, () => Math.random());
    let x = Array.from({ length: n - 2 }, () => Math.random());
    x = [0, ...x.sort(), 1];
    const easeType = Array.from({ length: n-1 }, () => Math.floor(Math.random() * 3));
    const easeStiff = Array.from({ length: n-1 }, () => Math.random()*0.75+0.125);
    console.log(easeType);
    console.log(easeStiff);
    
    const yInterp = [];

    for(let i = 0; i < resolution; i++){
        const xInterp = i / (resolution - 1);
        for (let j = 0; j < n-1; j++){
            if (x[j] <= xInterp && xInterp <= x[j + 1]) {
                yInterp.push((easeFunc(xInterp, easeType[j], easeStiff[j]) - 0.5)*(y[j+1]-y[j])+(y[j+1]+y[j])/2);
            }
        }
    }
    return yInterp;
}
*/

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
    for(let i = 0; i < resolution; i++){
        diff += Math.abs(wav[i] - ans[i]);
    }
    diff /= resolution;

    let scdiff = Math.exp(Math.log(0.965)*1296*diff*diff);
    
    statistics.innerHTML = `distance error: ${diff*36} semitone(s)<br>distance score: ${scdiff*100}%<br>best: ${currenthi*100}%` + (currenthi<scdiff?"<br>NEW BEST!":"");
    
    currenthi = currenthi<scdiff?scdiff:currenthi;
    return scdiff*100;
}

function resizeCanvas()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    cw = canvas.clientWidth;
    ch = canvas.clientHeight;
}

function reload()
{
    switch(optionEasing.value){
        case "cubic":
            nowAns = generateWave(points);
            break;
        case "linear":
            nowAns = generateWaveLinear(points);
            break;
    }
    //nowAns = nowAns.fill(0.5);
    nowWave = new Array(resolution).fill(0)
    ctx.clearRect(0, 0, cw, ch);
    isDraw = true;
    // Hilangkan animasi dan reset akurasi
    accuracy.classList.remove("visible");
    accuracy.style.width = "0"; // Reset lebar ke 0%
    accuracy.style.background = ""; // Reset gradient background

    // Sembunyikan kesimpulan
    conclusion.style.display = "none"; // Sembunyikan kesimpulan lagi
    configAlert.hidden = true;
}

function check()
{
    drawWave(nowAns, '#00ff00');
    score = calculateScore(nowWave, nowAns);
    isDraw = false;
    const widthPercentage = (score / 100) * 80; // 80% adalah lebar max dari box
    accuracy.style.width = widthPercentage + "%";

    accuracy.textContent = Math.floor(score * 100) / 100 + "%";

    // Ubah background gradient agar sesuai dengan score
    const gradientPercentage = score / 100; // Adjust color gradient based on score
    accuracy.style.background = `linear-gradient(to right, #00ff00, #ffff00 ${gradientPercentage}%, #ff0000)`;

    // Tampilkan elemen accuracy dengan animasi
    accuracy.classList.add("visible");

    // Ubah teks kesimpulan berdasarkan nilai akurasi
    let conclusionText = "";
    if (score < 40) {
      conclusionText = "Are you even trying";
    } else if (score >= 40 && score <= 60) {
      conclusionText = "Not bad for beginners";
    } else if (score > 60 && score <= 70) {
      conclusionText =
        "Not bad, could have been better if you paid more attention";
    } else if (score > 70 && score <= 80) {
      conclusionText = "I'm proud of you";
    } else if (score > 80 && score <= 95) {
      conclusionText = "Brilliant.";
    } else if (score > 95 && score < 100) {
      conclusionText = "Maybe try harder config";
    } else if (score == 100) {
      conclusionText = "Nice hack";
    }

    // Update kesimpulan dan tampilkan
    conclusion.querySelector("p").textContent = conclusionText;
    conclusion.style.display = "block"; // Tampilkan kesimpulan
}

// Event Listeners
canvas.addEventListener('mousedown', mouseDraw);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mouseup', mouseStop);
canvas.addEventListener('mouseleave', mouseStop);
expandBtn.addEventListener("click", function () {
    if (isExpanded) {
      // Jika sudah expand, kembalikan ke ukuran awal
      waveBox.style.maxHeight = "400px";
      expandBtn.innerHTML = '<img src="down.png" alt="Expand" />'; // Ubah icon menjadi panah ke bawah
    } else {
      // Jika belum expand, ubah menjadi fit-content
      waveBox.style.maxHeight = "fit-content";
      expandBtn.innerHTML = '<img src="up.svg" alt="Collapse" />'; // Ubah icon menjadi panah ke atas
    }

    // Toggle status expanded
    isExpanded = !isExpanded;
  });

boxConfig.onchange = ()=>{
    configAlert.hidden = false;
};

buttonCheck.onclick = check;
buttonPlay.onclick = ()=>{
    generateSound(nowAns, duration, volume); 
    const movingLine = document.getElementById("movingLine");
    movingLine.style.animation = "moveLine "+duration+"s linear forwards";

    movingLine.addEventListener("animationend", function () {
        movingLine.style.animation = ""; // Reset animasi setelah selesai
    });
};
buttonReload.onclick = ()=>{reload()};
window.addEventListener('resize', resizeCanvas);

sliderResolution.oninput = ()=>{
    resolution = 25*Math.pow(2,Number(sliderResolution.value));
    displayResolution.textContent = resolution;
};
sliderPoints.oninput = ()=>{
    points = Number(sliderPoints.value);
    displayPoints.textContent = points;
};
optionPitch.onchange = ()=>{pitch = Number(optionPitch.value)};
optionLine.onchange = ()=>{};
sliderVolume.oninput = ()=>{
    volume = sliderVolume.value;
    displayVolume.textContent = Math.round(volume*100)+"%";
};
sliderDuration.oninput = ()=>{
    duration = Number(sliderDuration.value);
    displayDuration.textContent = duration + " s";
};

// Initial
resizeCanvas();
reload();


// Get all card elements
const cards = document.querySelectorAll(".card");

// Loop through each card and add a click event listener
cards.forEach((card) => {
card.addEventListener("click", () => {
    // Toggle the 'expanded' class on click
    card.classList.toggle("expanded");
});
});