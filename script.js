// Game Configuration
const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = 20; // Each cell is 20px (400px / 20 = 20)
const INITIAL_SPEED = 150; // ms per frame
const SPEED_INCREMENT = 2; // Speed up every N foods eaten
const MIN_SPEED = 60; // Minimum frame time (max speed)

// Game State
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = 0;
let gameLoop = null;
let gameSpeed = INITIAL_SPEED;
let isPlaying = false;
let isPaused = false;
let foodEatenCount = 0;

// DOM Elements
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('gameover-overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const newHighScoreMsg = document.getElementById('new-high-score-msg');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const resumeBtn = document.getElementById('resume-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) {
        highScore = parseInt(saved, 10);
        highScoreEl.textContent = highScore;
    }
}

function saveHighScore() {
    localStorage.setItem('snakeHighScore', highScore.toString());
}

// Generate random position within grid
function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
}

// Check if position is occupied by snake
function isOccupiedBySnake(pos) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

// Spawn food at random valid position
function spawnFood() {
    let position;
    do {
        position = getRandomPosition();
    } while (isOccupiedBySnake(position));
    food = position;
}

// Reset game to initial state
function resetGame() {
    // Initialize snake in center, moving right
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = INITIAL_SPEED;
    foodEatenCount = 0;
    currentScoreEl.textContent = score;
    spawnFood();
    draw();
}

// Start the game loop
function startGame() {
    if (isPlaying) return;

    isPlaying = true;
    isPaused = false;

    // Hide overlays
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');

    // Enable pause button
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';

    // Start game loop
    gameLoop = setInterval(gameStep, gameSpeed);
}

// Pause the game
function pauseGame() {
    if (!isPlaying || isPaused) return;

    isPaused = true;
    clearInterval(gameLoop);
    gameLoop = null;
    pauseOverlay.classList.remove('hidden');
    pauseBtn.textContent = 'Resume';
}

// Resume the game
function resumeGame() {
    if (!isPlaying || !isPaused) return;

    isPaused = false;
    pauseOverlay.classList.add('hidden');
    pauseBtn.textContent = 'Pause';
    gameLoop = setInterval(gameStep, gameSpeed);
}

// End the game
function endGame() {
    isPlaying = false;
    isPaused = false;
    clearInterval(gameLoop);
    gameLoop = null;

    // Update final score
    finalScoreEl.textContent = score;

    // Check for new high score
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        highScoreEl.textContent = highScore;
        newHighScoreMsg.classList.remove('hidden');
    } else {
        newHighScoreMsg.classList.add('hidden');
    }

    // Show game over overlay
    gameOverOverlay.classList.remove('hidden');

    // Disable pause button
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
}

// Main game step
function gameStep() {
    if (!isPlaying || isPaused) return;

    // Update direction (prevents 180-degree turns)
    direction = { ...nextDirection };

    // Calculate new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame();
        return;
    }

    // Check self collision
    if (isOccupiedBySnake(head)) {
        endGame();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        // Eat food - grow snake, increase score
        score += 10;
        foodEatenCount++;
        currentScoreEl.textContent = score;
        spawnFood();

        // Increase speed periodically
        if (foodEatenCount % SPEED_INCREMENT === 0 && gameSpeed > MIN_SPEED) {
            gameSpeed -= 10;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, gameSpeed);
        }
    } else {
        // Normal movement - remove tail
        snake.pop();
    }

    draw();
}

// Draw everything on canvas
function draw() {
    // Clear canvas
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        const pos = i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }

    // Draw food
    const foodX = food.x * CELL_SIZE;
    const foodY = food.y * CELL_SIZE;
    const foodCenterX = foodX + CELL_SIZE / 2;
    const foodCenterY = foodY + CELL_SIZE / 2;
    const foodRadius = CELL_SIZE / 2 - 2;

    // Food glow
    const gradient = ctx.createRadialGradient(
        foodCenterX, foodCenterY, 0,
        foodCenterX, foodCenterY, foodRadius
    );
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(0.5, '#f59e0b');
    gradient.addColorStop(1, '#d97706');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Food sparkle
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(foodCenterX - 3, foodCenterY - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const padding = 1;
        const size = CELL_SIZE - padding * 2;
        const radius = 4;

        // Head vs body coloring
        if (index === 0) {
            // Head - brighter green with gradient
            const headGradient = ctx.createLinearGradient(x, y, x + size, y + size);
            headGradient.addColorStop(0, '#4ade80');
            headGradient.addColorStop(1, '#22c55e');
            ctx.fillStyle = headGradient;

            // Draw rounded rectangle for head
            drawRoundedRect(ctx, x + padding, y + padding, size, size, radius);
            ctx.fill();

            // Draw eyes
            drawEyes(ctx, segment, direction);
        } else {
            // Body - gradient based on position
            const intensity = 1 - (index / snake.length) * 0.4;
            const bodyGradient = ctx.createLinearGradient(x, y, x + size, y + size);
            bodyGradient.addColorStop(0, `rgba(34, 197, 94, ${intensity})`);
            bodyGradient.addColorStop(1, `rgba(21, 128, 61, ${intensity})`);
            ctx.fillStyle = bodyGradient;

            drawRoundedRect(ctx, x + padding, y + padding, size, size, radius);
            ctx.fill();

            // Segment separator
            if (index < snake.length - 1) {
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
                ctx.lineWidth = 1;
                drawRoundedRect(ctx, x + padding, y + padding, size, size, radius);
                ctx.stroke();
            }
        }
    });
}

// Helper: Draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Helper: Draw snake eyes based on direction
function drawEyes(ctx, head, dir) {
    const x = head.x * CELL_SIZE + CELL_SIZE / 2;
    const y = head.y * CELL_SIZE + CELL_SIZE / 2;
    const eyeOffset = 4;
    const eyeRadius = 2;

    ctx.fillStyle = '#0f172a';

    let eye1X, eye1Y, eye2X, eye2Y;

    if (dir.x === 1) { // Right
        eye1X = x + eyeOffset; eye1Y = y - eyeOffset;
        eye2X = x + eyeOffset; eye2Y = y + eyeOffset;
    } else if (dir.x === -1) { // Left
        eye1X = x - eyeOffset; eye1Y = y - eyeOffset;
        eye2X = x - eyeOffset; eye2Y = y + eyeOffset;
    } else if (dir.y === -1) { // Up
        eye1X = x - eyeOffset; eye1Y = y - eyeOffset;
        eye2X = x + eyeOffset; eye2Y = y - eyeOffset;
    } else { // Down
        eye1X = x - eyeOffset; eye1Y = y + eyeOffset;
        eye2X = x + eyeOffset; eye2Y = y + eyeOffset;
    }

    ctx.beginPath();
    ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
    ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
}

// Handle keyboard input
function handleKeydown(e) {
    const key = e.key;

    // Prevent default for game keys
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' ', 'Space'];
    if (gameKeys.includes(key)) {
        e.preventDefault();
    }

    // Direction keys
    if ((key === 'ArrowUp' || key === 'w' || key === 'W') && direction.y !== 1) {
        nextDirection = { x: 0, y: -1 };
    } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && direction.y !== -1) {
        nextDirection = { x: 0, y: 1 };
    } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && direction.x !== 1) {
        nextDirection = { x: -1, y: 0 };
    } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && direction.x !== -1) {
        nextDirection = { x: 1, y: 0 };
    }

    // Pause/Resume with Space
    if (key === ' ' || key === 'Space') {
        e.preventDefault();
        if (isPlaying && !isPaused) {
            pauseGame();
        } else if (isPlaying && isPaused) {
            resumeGame();
        }
    }

    // Start game with Enter/Space on start screen
    if (!isPlaying && (key === 'Enter' || key === ' ' || key === 'Space')) {
        if (startOverlay.classList.contains('hidden') === false) {
            startGame();
        }
    }
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
});
resumeBtn.addEventListener('click', resumeGame);
pauseBtn.addEventListener('click', () => {
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});
resetBtn.addEventListener('click', () => {
    if (isPlaying) {
        endGame();
    }
    resetGame();
});
document.addEventListener('keydown', handleKeydown);

// Initialize on load
loadHighScore();
resetGame();