// --- Game Variables ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreSpan = document.getElementById('score');
const highscoreSpan = document.getElementById('highscore');
const charSelect = document.getElementById('characters');
const welcomePage = document.getElementById('welcome-page');
const welcomeStartBtn = document.getElementById('welcome-start-btn');
const characterPreviews = document.getElementById('character-previews');
const gameUI = document.getElementById('game-ui');

const CHARACTERS = [
    { name: 'Red Rocket', color: '#e74c3c', emoji: '🚀' },
    { name: 'Green Ninja', color: '#27ae60', emoji: '🥷' },
    { name: 'Blue Wizard', color: '#2980b9', emoji: '🧙‍♂️' },
    { name: 'Yellow Star', color: '#f1c40f', emoji: '⭐' },
    { name: 'Purple Cat', color: '#8e44ad', emoji: '🐱' },
    { name: 'Orange Fox', color: '#e67e22', emoji: '🦊' },
    { name: 'Pink Bunny', color: '#fd79a8', emoji: '🐰' },
    { name: 'Cyan Robot', color: '#00bcd4', emoji: '🤖' }
];

let player = { x: 80, y: 300, w: 40, h: 40, vy: 0, jumping: false, color: CHARACTERS[0].color, emoji: CHARACTERS[0].emoji };
let obstacles = [];
let points = [];
let score = 0;
let highscore = 0;
let gameActive = false;
let obstacleTimer = 0;
let pointTimer = 0;
let selectedChar = 0;
let groundOffset = 0;
let frameCount = 0;

// --- Animated Sky Elements ---
const skyClouds = [
    { x: 100, y: 60, speed: 0.5, size: 1 },
    { x: 400, y: 100, speed: 0.3, size: 1.3 },
    { x: 700, y: 50, speed: 0.4, size: 0.8 },
];
const birds = [
    { x: 900, y: 80, speed: 1.2, dir: 1, flap: 0 },
    { x: 600, y: 130, speed: 0.9, dir: -1, flap: 0 },
];
let sunAngle = 0;

// --- Welcome Page Character Previews ---
function renderCharacterPreviews() {
    characterPreviews.innerHTML = '';
    CHARACTERS.forEach(char => {
        const div = document.createElement('div');
        div.className = 'character-preview';
        const art = document.createElement('div');
        art.className = 'character-art';
        art.style.borderColor = char.color;
        art.textContent = char.emoji;
        const name = document.createElement('div');
        name.className = 'character-name';
        name.textContent = char.name;
        div.appendChild(art);
        div.appendChild(name);
        characterPreviews.appendChild(div);
    });
}

// --- Setup Character Selection ---
function populateCharacters() {
    charSelect.innerHTML = '';
    CHARACTERS.forEach((char, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${char.emoji} ${char.name}`;
        charSelect.appendChild(opt);
    });
    charSelect.value = 0;
}
charSelect.addEventListener('change', e => {
    selectedChar = parseInt(e.target.value);
    player.color = CHARACTERS[selectedChar].color;
    player.emoji = CHARACTERS[selectedChar].emoji;
    draw();
});

// --- Game Functions ---
function resetGame() {
    player.y = 300;
    player.vy = 0;
    player.jumping = false;
    player.color = CHARACTERS[selectedChar].color;
    player.emoji = CHARACTERS[selectedChar].emoji;
    obstacles = [];
    points = [];
    score = 0;
    obstacleTimer = 0;
    pointTimer = 0;
    gameActive = true;
    groundOffset = 0;
    frameCount = 0;
}

function spawnObstacle() {
    const h = 40 + Math.random() * 40;
    obstacles.push({ x: 800, y: 360 - h, w: 30, h: h, baseY: 360 - h, wobbleSeed: Math.random() * 1000 });
}

function spawnPoint() {
    points.push({ x: 800, y: 320 - Math.random() * 120, r: 12, baseY: 320 - Math.random() * 120, bounceSeed: Math.random() * 1000 });
}

function update() {
    if (!gameActive) return;
    frameCount++;
    // Player physics
    if (player.jumping) {
        player.vy += 0.8; // gravity
        player.y += player.vy;
        if (player.y >= 300) {
            player.y = 300;
            player.vy = 0;
            player.jumping = false;
        }
    }
    // Obstacles
    obstacles.forEach(ob => {
        ob.x -= 6;
        // Wobble animation
        ob.y = ob.baseY + Math.sin((frameCount + ob.wobbleSeed) / 10) * 6;
    });
    obstacles = obstacles.filter(ob => ob.x + ob.w > 0);
    // Points
    points.forEach(pt => {
        pt.x -= 6;
        // Bounce animation
        pt.y = pt.baseY + Math.sin((frameCount + pt.bounceSeed) / 8) * 10;
    });
    points = points.filter(pt => pt.x + pt.r > 0);
    // Collision: Player & Obstacles
    for (let ob of obstacles) {
        if (player.x < ob.x + ob.w && player.x + player.w > ob.x && player.y + player.h > ob.y) {
            gameOver();
            return;
        }
    }
    // Collision: Player & Points
    for (let i = points.length - 1; i >= 0; i--) {
        let pt = points[i];
        if (player.x < pt.x + pt.r && player.x + player.w > pt.x && player.y < pt.y + pt.r && player.y + player.h > pt.y) {
            score += 10;
            scoreSpan.textContent = 'Score: ' + score;
            points.splice(i, 1);
        }
    }
    // Timers
    obstacleTimer++;
    if (obstacleTimer > 60 + Math.random() * 60) {
        spawnObstacle();
        obstacleTimer = 0;
    }
    pointTimer++;
    if (pointTimer > 90 + Math.random() * 60) {
        spawnPoint();
        pointTimer = 0;
    }
    // Parallax ground
    groundOffset = (groundOffset - 3) % 40;
    // Animate clouds
    skyClouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > 900) cloud.x = -150;
    });
    // Animate birds
    birds.forEach(bird => {
        bird.x += bird.speed * bird.dir;
        bird.flap += 0.2;
        if (bird.dir === 1 && bird.x > 900) bird.x = -100;
        if (bird.dir === -1 && bird.x < -100) bird.x = 900;
    });
    // Animate sun
    sunAngle += 0.005;
}

function draw() {
    ctx.clearRect(0, 0, 800, 400);
    // Sky gradient
    let skyGradient = ctx.createLinearGradient(0, 0, 0, 400);
    skyGradient.addColorStop(0, '#e0f7fa');
    skyGradient.addColorStop(1, '#b2ebf2');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, 800, 400);
    // Sun
    let sunX = 700 + Math.sin(sunAngle) * 60;
    let sunY = 80 + Math.cos(sunAngle) * 10;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 223, 70, 0.95)';
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
    // Clouds
    skyClouds.forEach(cloud => {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, 50 * cloud.size, 22 * cloud.size, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x + 30 * cloud.size, cloud.y + 10 * cloud.size, 30 * cloud.size, 16 * cloud.size, 0, 0, Math.PI * 2);
        ctx.ellipse(cloud.x - 30 * cloud.size, cloud.y + 8 * cloud.size, 28 * cloud.size, 14 * cloud.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    // Birds
    birds.forEach(bird => {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.scale(bird.dir, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(18, Math.sin(bird.flap) * 8);
        ctx.lineTo(36, 0);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    });
    // Parallax ground
    ctx.fillStyle = '#95a5a6';
    for (let i = -1; i < 21; i++) {
        ctx.fillRect(i * 40 + groundOffset, 340, 20, 60);
    }
    // Player
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.font = '2em Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.emoji, player.x + player.w / 2, player.y + player.h / 2);
    ctx.restore();
    // Obstacles
    obstacles.forEach(ob => {
        ctx.save();
        ctx.shadowColor = '#2d3436';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        ctx.restore();
    });
    // Points
    points.forEach(pt => {
        ctx.save();
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function gameOver() {
    gameActive = false;
    if (score > highscore) {
        highscore = score;
        highscoreSpan.textContent = 'Highscore: ' + highscore;
        localStorage.setItem('jumpGameHighscore', highscore);
    }
    startBtn.disabled = false;
    startBtn.textContent = 'Restart Game';
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Controls ---
document.addEventListener('keydown', e => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !player.jumping && gameActive) {
        player.vy = -14;
        player.jumping = true;
    }
});
canvas.addEventListener('mousedown', () => {
    if (!player.jumping && gameActive) {
        player.vy = -14;
        player.jumping = true;
    }
});

// --- Start Button ---
startBtn.addEventListener('click', () => {
    resetGame();
    startBtn.disabled = true;
    startBtn.textContent = 'Game Running...';
});

// --- Welcome Page Logic ---
if (welcomeStartBtn) {
    welcomeStartBtn.addEventListener('click', () => {
        welcomePage.style.display = 'none';
        gameUI.style.display = '';
        canvas.style.display = '';
    });
}

// --- Initialization ---
function init() {
    renderCharacterPreviews();
    populateCharacters();
    highscore = parseInt(localStorage.getItem('jumpGameHighscore')) || 0;
    highscoreSpan.textContent = 'Highscore: ' + highscore;
    draw();
    gameLoop();
}
init(); 