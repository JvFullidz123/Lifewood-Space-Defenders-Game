class Particle {
    constructor(x, y, size, speedX, speedY, color, life) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
        this.life = life;
        this.alpha = 1; // Opacity for fading effect
        this.shapeType = Math.floor(Math.random() * 3); // 0 = Triangle, 1 = Square, 2 = Jagged
        this.angle = Math.random() * Math.PI * 2; // Random rotation
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 1;
        this.alpha -= 0.02; // Gradually fade out
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;

        // Draw different explosion shapes
        if (this.shapeType === 0) {
            // Triangle Explosion Piece
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size, this.size);
            ctx.lineTo(-this.size, this.size);
            ctx.closePath();
        } else if (this.shapeType === 1) {
            // Square Explosion Piece
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            // Jagged Star-Like Piece
            ctx.beginPath();
            ctx.moveTo(-this.size, 0);
            ctx.lineTo(0, -this.size);
            ctx.lineTo(this.size, 0);
            ctx.lineTo(0, this.size);
            ctx.closePath();
        }

        ctx.fill();
        ctx.restore();
    }
}

let particles = []; // Array to store particles

// Function to Create Explosion
function createExplosion(x, y, color = "orange") {
    for (let i = 0; i < 20; i++) { // Number of particles
        let speedX = (Math.random() - 0.5) * 4;
        let speedY = (Math.random() - 0.5) * 4;
        let size = Math.random() * 10 + 5;
        let life = Math.random() * 30 + 20;
        particles.push(new Particle(x, y, size, speedX, speedY, color, life));
    }
}

// Update Particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        particle.update();
        if (particle.life <= 0 || particle.alpha <= 0) {
            particles.splice(i, 1); // Remove when faded out
        }
    }

    particles.forEach(particle => {
        particle.draw(ctx);
    });
}

function updateHUD() {
    document.getElementById("score").textContent = `Score: ${score}`;
    document.getElementById("level").textContent = `Level: ${level}`;
    document.getElementById("health").textContent = `Health: ${playerHealth}`;
}


// Power-Up Types
const powerUpTypes = [
    { type: "dualShot", effect: () => activateDualShot() }, // Permanent upgrade
    { type: "fireRateBoost", effect: () => activateTemporaryFireRateBoost(10000) }, // Double fire rate for 10 seconds
    { type: "tripleProjectile", effect: () => activateTripleProjectileAndFireRate() }, // Permanent upgrade
    { type: "healthPack", effect: () => (playerHealth = Math.min(playerHealth + 1, 3)) }, // Restore health
];

// Spawn Power-Ups
function spawnPowerUp(x, y) {
    const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({ 
        x,
        y,
        width: TILE_SIZE,
        height: TILE_SIZE,
        speed: TILE_SIZE / 50, // Slower drop speed
        ...randomPowerUp,
    });
}

// Activate Temporary Power-Up
function activateTemporaryPowerUp(style, duration) {
    if (player.shootingStyle !== 2) {
        player.shootingStyle = style;
        player.powerUpTimer = frameCount + duration / (1000 / 60); // Convert duration to frames

        setTimeout(() => {
            player.shootingStyle = 1; // Revert to default style
        }, duration);
    }
}

function activateTemporaryFireRateBoost(duration) {
    if (!player.fireRateBoostActive) {
        player.fireRateBoostActive = true;
        playerFireRate /= 2; // Double the fire rate

        setTimeout(() => {
            playerFireRate *= 2; // Revert to normal fire rate
            player.fireRateBoostActive = false;
        }, duration);
    }
}

function activateTemporaryTripleBurst(duration) {
    player.shootingStyle = 5; // Set to triple burst style
    playerFireRate /= 2; // Double the fire rate
    player.powerUpTimer = frameCount + duration / (1000 / 60); // Convert duration to frames

    setTimeout(() => {
        player.shootingStyle = 1; // Revert to default style
        playerFireRate *= 2; // Revert to normal fire rate
    }, duration);
}

function activateTripleProjectileAndFireRate() {
    player.shootingStyle = 3; // Triple projectile
    playerFireRate /= 2; // Double fire rate permanently
}

const powerUpSounds = {
    dualShot: new Audio("assets/sounds/powerup_dualshot.wav"),
    healthPack: new Audio("assets/sounds/powerup_healthpack.wav"),
    laserBeam: new Audio("assets/sounds/powerup_laserbeam2.wav"),
    homingMissile: new Audio("assets/sounds/powerup_homingmissile.wav"),
};

// Update Power-Ups
function updatePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed; // Move power-ups downward

        // Check if the player collects the power-up
        if (
            powerUp.x < player.x + player.width &&
            powerUp.x + powerUp.width > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + powerUp.height > player.y
        ) {
            powerUp.effect(); // Apply the power-up effect

            // Play the corresponding sound effect
            if (powerUpSounds[powerUp.type]) {
                powerUpSounds[powerUp.type].currentTime = 0;
                powerUpSounds[powerUp.type].play();
            }

            powerUps.splice(index, 1); // Remove the power-up
        } else if (powerUp.y > SCREEN_HEIGHT) {
            powerUps.splice(index, 1); // Remove power-ups that exit the screen
        }
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        // Draw the power-up
        ctx.fillStyle = powerUp.type === "healthPack" ? "green" : "blue";
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);

        // Draw the label
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        let label = "";
        if (powerUp.type === "dualShot") label = "DS";
        else if (powerUp.type === "laserBeam") label = "LS";
        else if (powerUp.type === "homingMissile") label = "MI";
        else if (powerUp.type === "healthPack") label = "HP";
        ctx.fillText(label, powerUp.x + powerUp.width / 4, powerUp.y + powerUp.height / 1.5);
    });
}
    

// **Starfield Background**
const stars = [];
const numStars = 100; // Number of stars
const starSpeed = 0.2; // Fixed speed of the stars

// Initialize stars
function createStars() {
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * SCREEN_WIDTH,
            y: Math.random() * SCREEN_HEIGHT,
            size: Math.random() * 2 + 1, // Random size between 1 and 3
            speed: starSpeed, // Fixed speed for all stars
        });
    }
}

// Update star positions
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed; // Move the star downward
        if (star.y > SCREEN_HEIGHT) {
            // Reset star to the top when it goes off-screen
            star.y = 0;
            star.x = Math.random() * SCREEN_WIDTH;
        }
    });
}

// Draw stars
function drawStars() {
    ctx.fillStyle = "white";
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}



function triggerSlowMotion() {
    let originalFrameRate = 60; // Original frame rate
    let slowMotionFrameRate = 10; // Slow-motion frame rate

    let slowMotionInterval = setInterval(() => {
        if (originalFrameRate <= slowMotionFrameRate) {
            clearInterval(slowMotionInterval);
        } else {
            originalFrameRate -= 1; // Gradually slow down
        }
    }, 500); // Adjust over 5 seconds
}

function fadeOutAudio(audio, duration) {
    let fadeInterval = setInterval(() => {
        if (audio.volume > 0) {
            audio.volume -= 0.1; // Gradually reduce volume
        } else {
            clearInterval(fadeInterval);
            audio.pause();
        }
    }, duration / 10); // Divide duration into 10 steps
}

function playDeathSequence() {
    const deathSound = new Audio("assets/sounds/player_death_sfx.wav");
    const gameOverTheme = new Audio("assets/sounds/gameover_themesong.mp3");

    // Play death sound
    deathSound.play();

    // Fade out background music
    fadeOutAudio(backgroundMusic, 5000);

    // After death sound, play game over theme
    deathSound.onended = () => {
        gameOverTheme.play();
    };
}

function showGameOverScreen() {
    const gameOverScreen = document.createElement("div");
    gameOverScreen.id = "gameOverScreen";
    gameOverScreen.style.position = "absolute";
    gameOverScreen.style.top = "0";
    gameOverScreen.style.left = "0";
    gameOverScreen.style.width = "100%";
    gameOverScreen.style.height = "100%";
    gameOverScreen.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    gameOverScreen.style.color = "white";
    gameOverScreen.style.display = "flex";
    gameOverScreen.style.flexDirection = "column";
    gameOverScreen.style.justifyContent = "center";
    gameOverScreen.style.alignItems = "center";
    gameOverScreen.innerHTML = `
        <h1>Game Over</h1>
        <button id="restartButton">Restart</button>
    `;

    document.body.appendChild(gameOverScreen);

    // Restart the game when the button is clicked
    document.getElementById("restartButton").addEventListener("click", () => {
        location.reload();
    });
}

// **Canvas and Grid Setup**
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// const TILE_SIZE = 32; // Tile size remains the same
// const GRID_ROWS = 40; // Number of rows in the grid (720px / 32px = 40)
// const GRID_COLS = 22; // Number of columns in the grid (1280px / 32px = 22)
// const SCREEN_WIDTH = TILE_SIZE * GRID_COLS; // 1280px
// const SCREEN_HEIGHT = TILE_SIZE * GRID_ROWS; // 720px

const TILE_SIZE = 32; // Tile size remains the same
const GRID_ROWS = 32; // Number of rows in the grid (1024px / 32px = 32)
const GRID_COLS = 24; // Number of columns in the grid (768px / 32px = 24)
const SCREEN_WIDTH = TILE_SIZE * GRID_COLS; // 768px
const SCREEN_HEIGHT = TILE_SIZE * GRID_ROWS; // 1024px


canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;


// **Sound Effects**
const playerShootSound = new Audio("assets/sounds/player_shootsfx.wav");
const explosionSounds = [
    new Audio("assets/sounds/entity_explosion.wav")
    // new Audio("assets/sounds/entity_explosion2.wav"),
];

// Function to play a random explosion sound
function playExplosionSound() {
    const randomIndex = Math.floor(Math.random() * explosionSounds.length);
    explosionSounds[randomIndex].currentTime = 0; // Reset sound to the beginning
    explosionSounds[randomIndex].play();
}

// **Background Music**
const backgroundMusic = new Audio("assets/sounds/gameplay_music3.mp3");
backgroundMusic.loop = true; // Loop the music
backgroundMusic.volume = 0.5; // Set the volume (adjust as needed)

// Function to start background music
function startBackgroundMusic() {
    backgroundMusic.play().catch((error) => {
        console.error("Background music could not be played:", error);
    });
}

// Function to start background music after user interaction
function startBackgroundMusic() {
    const enableAudio = () => {
        backgroundMusic.play().catch((error) => {
            console.error("Background music could not be played:", error);
        });

        // Remove the event listeners after starting the music
        document.removeEventListener("click", enableAudio);
        document.removeEventListener("keydown", enableAudio);
    };

    // Add event listeners for user interaction
    document.addEventListener("click", enableAudio);
    document.addEventListener("keydown", enableAudio);
}

// **Load Sprites**
const playerIdleSprite = new Image();
playerIdleSprite.src = "assets/img/playeridle.png";

const playerLeftSprite = new Image();
playerLeftSprite.src = "assets/img/playergoingleft.png";

const playerRightSprite = new Image();
playerRightSprite.src = "assets/img/playergoingright.png";

const playerDownSprite = new Image();
playerDownSprite.src = "assets/img/playergoingdown.png";

const enemySprite = new Image();
enemySprite.src = "assets/img/enemy_1.png";

const enemyProjectileSprite = new Image();
enemyProjectileSprite.src = "assets/img/enemy_projectile.png";

const miniBossSprite = new Image();
miniBossSprite.src = "assets/img/enemy_2_miniboss2.png";

// **Load Enemy Sprites**
const enemySprite1 = new Image();
enemySprite1.src = "assets/img/enemy_1.png";

const enemySprite2 = new Image();
enemySprite2.src = "assets/img/enemy_2.png";

const enemySprite3 = new Image();
enemySprite3.src = "assets/img/enemy_3v2.png";

// **Enemy Types**
const enemyTypes = [
    {
        sprite: enemySprite1,
        health: 1,
        speed: TILE_SIZE / 4,
        frameWidth: 96, // 384px / 4 frames
        frameHeight: 103,
    },
    {
        sprite: enemySprite2,
        health: 2,
        speed: TILE_SIZE / 3,
        frameWidth: 96, // 384px / 4 frames
        frameHeight: 103,
    },
    {
        sprite: enemySprite3,
        health: 3,
        speed: TILE_SIZE / 2,
        frameWidth: 96, // 384px / 4 frames
        frameHeight: 128,
    },
];

// **Ensure All Images Load Before Starting Game Loop**
miniBossSprite.onload = enemySprite.onload = enemyProjectileSprite.onload = playerIdleSprite.onload = playerLeftSprite.onload = playerRightSprite.onload = playerDownSprite.loading = function () {
    gameLoop(); // Start game loop once all images load
};

// **Player Object (No Changes to Size or Position)**
// const player = {
//     x: Math.floor(GRID_COLS / 2) * TILE_SIZE, // Center horizontally
//     y: SCREEN_HEIGHT - 4 * TILE_SIZE, // Position at bottom of screen
//     width: TILE_SIZE * 2, // Player occupies 2 tiles
//     height: TILE_SIZE * 2,
//     speed: TILE_SIZE,
//     bullets: [],
//     lives: 3,
//     frameX: 0,
//     frameWidth: 64, // Width of a single frame in the sprite sheet
//     frameHeight: 64, // Height of a single frame in the sprite sheet
//     frameCount: 2, // Total number of frames in the idle animation
//     currentFrame: 0,
//     frameDelay: 0,
//     frameDelayMax: 15,
//     sprite: playerIdleSprite,
//     moving: false,
// };

// Recommended: Slightly larger spaceship for better mobile visibility
// test for playeridle3 sprite 96x96
const player = {
    x: Math.floor(GRID_COLS / 2) * TILE_SIZE, // Center horizontally
    y: SCREEN_HEIGHT - 4 * TILE_SIZE, // Position at bottom of screen
    width: TILE_SIZE * 3, // Visual size remains 96x96
    height: TILE_SIZE * 3,
    speed: TILE_SIZE * 2, // Double the player's speed
    bullets: [],
    lives: 3,
    frameX: 0,
    frameWidth: 96, // Adjust sprite frame width
    frameHeight: 96, // Adjust sprite frame height
    frameCount: 2, // Keep animation frames
    currentFrame: 0,
    frameDelay: 0,
    frameDelayMax: 15,
    sprite: playerIdleSprite,
    moving: false,
    invulnerable: false, // Invulnerability flag
    invulnerabilityTimer: 0, // Timer to track invulnerability
    hitbox: {
        xOffset: TILE_SIZE, // Offset to center the hitbox
        yOffset: TILE_SIZE, // Offset to center the hitbox
        width: TILE_SIZE, // Hitbox is 1 tile wide
        height: TILE_SIZE, // Hitbox is 1 tile tall
    },
    shootingStyle: 1, // Default shooting style
    powerUpTimer: 0, // Timer for temporary power-ups
};


let currentWave = 1; 
let enemiesPerWave = 5; 
let enemiesDestroyed = 0; 
let waitingForNextWave = false; 
let enemies = [];
let enemyBullets = [];
let frameCount = 0;
let gameStarted = false;
let cutsceneComplete = false;
let miniBoss = null;
let score = 0; // Player's score
let level = 0; // Current level
let playerHealth = 3; // Player's health



// **Enemy Object (No Changes to Size or Speed)**
// ORIGINAL ENEMY OBJECT
// function createEnemies() {
//     enemies = [];
//     let formation = currentWave % 3; // Cycle through 3 patterns

//     for (let i = 0; i < enemiesPerWave; i++) {
//         let xPos, yPos = -TILE_SIZE * (i % 5);

//         if (formation === 0) { // V-Formation
//             xPos = (GRID_COLS / 2 + (i % 5 - 2)) * TILE_SIZE;
//         } else if (formation === 1) { // Straight Line
//             xPos = (i % 10) * TILE_SIZE * 2;
//         } else { // Random Scatter
//             xPos = Math.floor(Math.random() * GRID_COLS) * TILE_SIZE;
//         }

//         enemies.push({
//             x: xPos,
//             y: yPos,
//             width: TILE_SIZE,
//             height: TILE_SIZE,
//             speed: TILE_SIZE / 4,
//             direction: Math.random() > 0.5 ? "left" : "right",
//             health: 1,
//         });
//     }

//     waitingForNextWave = false; // Reset flag
// }

// First Functioning (Working)
// function createEnemies() {
//     enemies = [];
//     for (let i = 0; i < enemiesPerWave; i++) {
//         let enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
//         let xPos = Math.floor(Math.random() * GRID_COLS) * TILE_SIZE;
//         let yPos = -TILE_SIZE * (i % 5); // Stagger enemies vertically

//         enemies.push({
//             x: xPos,
//             y: yPos,
//             width: TILE_SIZE * 3,
//             height: TILE_SIZE * 3,
//             speed: enemyType.speed / 4, // Reduce base speed
//             health: enemyType.health,
//             sprite: enemyType.sprite,
//             frameX: 0,
//             frameWidth: enemyType.frameWidth,
//             frameHeight: enemyType.frameHeight,
//             frameCount: 4,
//             currentFrame: 0,
//             frameDelay: 0,
//             frameDelayMax: 10,
//         });
//     }
// }

// Second Functioning (Modified)
function createEnemies() {
    enemies = [];
    for (let i = 0; i < enemiesPerWave; i++) {
        let enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        let xPos = Math.floor(Math.random() * GRID_COLS) * TILE_SIZE;
        let yPos = -TILE_SIZE * (i % 5); // Stagger enemies vertically

        enemies.push({
            x: xPos,
            y: yPos,
            width: TILE_SIZE * 3,
            height: TILE_SIZE * 3,
            speed: enemyType.speed / 4, // Reduce base speed
            health: enemyType.health,
            sprite: enemyType.sprite,
            frameX: 0,
            frameWidth: enemyType.frameWidth,
            frameHeight: enemyType.frameHeight,
            frameCount: 4,
            currentFrame: 0,
            frameDelay: 0,
            frameDelayMax: 10,
        });
    }
}
// // Mini-Boss Setup (Fixed)
// function spawnMiniBoss() {
//     miniBoss = {
// // Mini-Boss Setup (Fixed)
// function spawnMiniBoss() {
//     miniBoss = {
//         x: (GRID_COLS / 2) * TILE_SIZE - TILE_SIZE,
//         y: -TILE_SIZE,
//         width: TILE_SIZE * 2,
//         height: TILE_SIZE * 2,
//         speed: TILE_SIZE / 8, // Slower speed
//         direction: "right",
//         health: 5,
//         hit: false, // Flashing effect when hit
//         hitFrames: 0 // Tracks how long it flashes
//     };
//     bossSpawned = true;
// }

// **Mini-Boss Initialization**
// function spawnMiniBoss() {
//     miniBoss = {
//         x: (SCREEN_WIDTH / 2) - (TILE_SIZE * 6), // Centered on screen
//         y: -TILE_SIZE * 4, // Spawns above the screen
//         width: TILE_SIZE * 12,
//         height: TILE_SIZE * 4,
//         speed: TILE_SIZE / 32, // Smooth slow movement
//         direction: "down",
//         health: 20,
//         hit: false,
//         hitFrames: 0,

//         // **Animation**
//         frameX: 0,
//         frameWidth: 144,  // Each frame is 144px wide
//         frameHeight: 192, // Frame height
//         frameCount: 4,    // 4 animation frames
//         currentFrame: 0,
//         frameDelay: 0,
//         frameDelayMax: 120, // 2-3 seconds per frame

//         // **Shooting**
//         lastShotTime: 0,
//         shootingCooldown: 180, // Shoots every 3 seconds

//         hitbox: {
//             xOffset: 0,
//             yOffset: 0,
//             width: TILE_SIZE * 12,
//             height: TILE_SIZE * 4,
//         },
//     };
//     bossSpawned = true;
// }
// // Mini-Boss Movement (Slower & Controlled)
// function moveMiniBoss() {
//     if (!miniBoss) return;

//     // Move boss only every 5 frames to slow down movement
//     if (frameCount % 5 === 0) {
//         if (miniBoss.direction === "right") {
//             miniBoss.x += miniBoss.speed;
//             if (miniBoss.x >= SCREEN_WIDTH - miniBoss.width) miniBoss.direction = "left";
//         } else {
//             miniBoss.x -= miniBoss.speed;
//             if (miniBoss.x <= 0) miniBoss.direction = "right";
//         }
//     }

//     // Boss Shooting (Now every 1.5 seconds)
//     if (frameCount % 90 === 0) {
//         enemyBullets.push({
//             x: miniBoss.x + miniBoss.width / 2 - 2,
//             y: miniBoss.y + miniBoss.height,
//             width: 4,
//             height: 10,
//             speed: TILE_SIZE / 12 // Slower bullets
//         });
//     }
// }
// **Mini-Boss Movement (Top-Down Entry & Side-to-Side)**
// function moveMiniBoss() {
//     if (!miniBoss) return;

//     if (miniBoss.direction === "down") {
//         miniBoss.y += miniBoss.speed; // Move down smoothly
//         if (miniBoss.y >= TILE_SIZE * 3) { 
//             miniBoss.direction = "right"; // Switch to horizontal movement
//         }
//     } else {
//         if (miniBoss.direction === "right") {
//             miniBoss.x += miniBoss.speed;
//             if (miniBoss.x + miniBoss.width >= SCREEN_WIDTH) miniBoss.direction = "left";
//         } else if (miniBoss.direction === "left") {
//             miniBoss.x -= miniBoss.speed;
//             if (miniBoss.x <= 0) miniBoss.direction = "right";
//         }
//     }
// }

// **Draw Player with Idle Animation**
function drawPlayer() {
    if (player.invulnerable) {
        ctx.globalAlpha = 0.5; // Make the player semi-transparent
    }

    ctx.drawImage(
        player.sprite,
        player.frameX * player.frameWidth, // Crop X (frame selection)
        0, // Crop Y (row is always 0 for idle animation)
        player.frameWidth,
        player.frameHeight,
        player.x,
        player.y,
        player.width,
        player.height
    );

    ctx.globalAlpha = 1.0; // Reset transparency
 
    // Animate idle if the player is not moving
    if (!player.moving) {
        if (player.frameDelay++ > player.frameDelayMax) {
            player.currentFrame = (player.currentFrame + 1) % player.frameCount; // Loop through 2 frames
            player.frameX = player.currentFrame; // Update frame X
            player.frameDelay = 0; // Reset delay counter
        }
    }
}

// Original Enemy Function
// function drawEnemies() {
//     ctx.fillStyle = "red";
//     enemies.forEach(enemy => {
//         ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
//     });
// }

// **Draw Enemies**
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(
            enemy.sprite,
            enemy.frameX * enemy.frameWidth, // Crop X (frame selection)
            0, // Crop Y (row is always 0 for this sprite sheet)
            enemy.frameWidth,
            enemy.frameHeight,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );

        // Animate the enemy sprite
        if (enemy.frameDelay++ > enemy.frameDelayMax) {
            enemy.currentFrame = (enemy.currentFrame + 1) % enemy.frameCount; // Loop through frames
            enemy.frameX = enemy.currentFrame; // Update frame X
            enemy.frameDelay = 0; // Reset delay counter
        }
    });
}

// // Mini-Boss Draw Function (Flash Red on Hit)
// function drawMiniBoss() {
//     if (!miniBoss) return;
    
//     if (miniBoss.hit) {
//         ctx.fillStyle = "red"; // Flash red when hit
//         miniBoss.hitFrames++;
//         if (miniBoss.hitFrames > 5) { // Flash for 5 frames
//             miniBoss.hit = false;
//             miniBoss.hitFrames = 0;
//         }
//     } else {
//         ctx.fillStyle = "purple"; // Normal color
//     }

//     ctx.fillRect(miniBoss.x, miniBoss.y, miniBoss.width, miniBoss.height);
// }

// Draw Mini-Boss
// function drawMiniBoss() {
//     if (!miniBoss) return;

//     // **Animate Mini-Boss Smoothly**
//     if (miniBoss.frameDelay++ >= miniBoss.frameDelayMax) {
//         miniBoss.currentFrame = (miniBoss.currentFrame + 1) % miniBoss.frameCount;
//         miniBoss.frameX = miniBoss.currentFrame * miniBoss.frameWidth;
//         miniBoss.frameDelay = 0; // Reset delay
//     }

//     ctx.drawImage(
//         miniBossSprite,
//         miniBoss.frameX, 0,                // Crop X, Crop Y
//         miniBoss.frameWidth, miniBoss.frameHeight,  // Frame Size
//         miniBoss.x, miniBoss.y,            // Position on Canvas
//         miniBoss.width, miniBoss.height    // Draw Size
//     );

//     // **Flashing Effect When Hit**
//     if (miniBoss.hit) {
//         ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
//         ctx.fillRect(miniBoss.x, miniBoss.y, miniBoss.width, miniBoss.height);
//         miniBoss.hitFrames++;
//         if (miniBoss.hitFrames > 5) {
//             miniBoss.hit = false;
//             miniBoss.hitFrames = 0;
//         }
//     }
// }


// Original Bullet Function (without sprite)
// function drawBullets() {
//     ctx.fillStyle = "yellow";
//     player.bullets.forEach(bullet => {
//         ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
//     });

//     ctx.fillStyle = "purple";
//     enemyBullets.forEach(bullet => {
//         ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
//     });
// }


// **Draw Bullets with Sprite**
function drawBullets() {
    // Draw player bullets
    ctx.fillStyle = "yellow";
    player.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemy bullets with sprite
    enemyBullets.forEach(bullet => {
        ctx.drawImage(
            enemyProjectileSprite,
            bullet.frameX * 32.75, // Crop X (131px / 4 frames)
            0, // Crop Y (row is always 0)
            32.75, // Frame width
            72, // Frame height
            bullet.x, // X position on canvas
            bullet.y, // Y position on canvas
            bullet.width, // Draw width
            bullet.height // Draw height
        );

        // Animate the enemy projectile
        if (bullet.frameDelay++ > bullet.frameDelayMax) {
            bullet.currentFrame = (bullet.currentFrame + 1) % 4; // Loop through 4 frames
            bullet.frameX = bullet.currentFrame; // Update frame X
            bullet.frameDelay = 0; // Reset delay counter
        }
    });
}
function activateDualShot() {
    if (player.shootingStyle < 2) {
        player.shootingStyle = 2; // Enable dual shot
    }
}

// Bullet Movement
function updateBullets() {
    // Update player bullets
    player.bullets.forEach(bullet => bullet.y -= TILE_SIZE / 2);
    player.bullets = player.bullets.filter(bullet => bullet.y > 0);

    // Update enemy bullets
    enemyBullets.forEach(bullet => bullet.y += bullet.speed); // Move enemy bullets downward
    enemyBullets = enemyBullets.filter(bullet => bullet.y < SCREEN_HEIGHT); // Remove bullets that exit the canvas
}

// **Enemy Movement**
function moveEnemies() {
    if (!gameStarted) return;

    if (frameCount % 30 === 0) { // Update movement every 30 frames
        enemies.forEach(enemy => {
            // Randomly change direction
            if (Math.random() > 0.7) enemy.direction = Math.random() > 0.5 ? "left" : "right";

            // Move left or right
            if (enemy.direction === "left" && enemy.x > 0) {
                enemy.x -= enemy.speed;
            } else if (enemy.direction === "right" && enemy.x < SCREEN_WIDTH - enemy.width) {
                enemy.x += enemy.speed;
            }

            // Move downward if not past halfway point
            if (enemy.y < SCREEN_HEIGHT / 2) {
                enemy.y += enemy.speed;
            }
        });
    }
}

// Enemy Shooting Behavior: Only fire when fully inside the canvas
function enemyShoot() {
    enemies.forEach(enemy => {
        if (enemy.y >= 0 && enemy.y + enemy.height <= SCREEN_HEIGHT) { // Fully inside the canvas
            const hasActiveBullet = enemyBullets.some(bullet => bullet.owner === enemy);

            if (!hasActiveBullet) {
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - TILE_SIZE / 2, // Center the projectile
                    y: enemy.y + enemy.height,
                    width: TILE_SIZE, // Set width to 1 tile size
                    height: TILE_SIZE, // Set height to 1 tile size
                    speed: TILE_SIZE / 100, // Bullet speed
                    frameX: 0, // Start at the first frame
                    currentFrame: 0,
                    frameDelay: 0,
                    frameDelayMax: 10, // Delay between frame changes
                    owner: enemy, // Track which enemy fired the bullet
                });
            }
        }
    });
}

// **Mini-Boss Shooting with Cooldown**
// function shootMiniBossBullets() {
//     if (!miniBoss) return;

//     if (frameCount - miniBoss.lastShotTime >= miniBoss.shootingCooldown) {
//         for (let i = 0; i < 4; i++) {
//             enemyBullets.push({
//                 x: miniBoss.x + (i * (miniBoss.width / 4)) + (miniBoss.width / 8) - 16,
//                 y: miniBoss.y + miniBoss.height,
//                 width: 32,
//                 height: 32,
//                 speed: TILE_SIZE / 8,
//                 frameX: 0,
//                 frameWidth: 32,
//                 frameHeight: 32,
//                 frameCount: 4,
//                 currentFrame: 0,
//                 frameDelay: 0,
//                 frameDelayMax: 10,
//             });
//         }
//         miniBoss.lastShotTime = frameCount;
//     }
// }

// **Enemy Bullet Movement (Slower)** (Modified)
function updateBullets() {
    // Update player bullets
    player.bullets.forEach(bullet => bullet.y -= TILE_SIZE / 2);
    player.bullets = player.bullets.filter(bullet => bullet.y > 0);

    // Update enemy bullets
    enemyBullets.forEach(bullet => bullet.y += bullet.speed); // Move enemy bullets downward
    enemyBullets = enemyBullets.filter(bullet => bullet.y < SCREEN_HEIGHT); // Remove bullets that exit the canvas
}

// Call enemyShoot at a slower, random interval
setInterval(enemyShoot, Math.floor(Math.random() * 1000) + 500); // Shoots between 0.5s - 1.5s randomly

// Fix: Mini-Boss Takes Damage Correctly (WORKING)
// function checkCollisions() {
//     player.bullets.forEach((bullet, bulletIndex) => {
//         enemies.forEach((enemy, enemyIndex) => {
//             if (
//                 bullet.x < enemy.x + enemy.width &&
//                 bullet.x + bullet.width > enemy.x &&
//                 bullet.y < enemy.y + enemy.height &&
//                 bullet.y + bullet.height > enemy.y
//             ) {
//                 enemy.health -= 1;
//                 if (enemy.health <= 0) {
//                     enemies.splice(enemyIndex, 1);
//                     enemiesDestroyed++; // Increase kill count
//                 }
//                 player.bullets.splice(bulletIndex, 1);
//             }
//         });

//         // Fix: Mini-Boss takes damage and dies properly
//         if (miniBoss && bullet.x < miniBoss.x + miniBoss.width &&
//             bullet.x + bullet.width > miniBoss.x &&
//             bullet.y < miniBoss.y + miniBoss.height &&
//             bullet.y + bullet.height > miniBoss.y) {
            
//             miniBoss.health -= 1;
//             miniBoss.hit = true; // Enable flashing effect
//             player.bullets.splice(bulletIndex, 1);
            
//             if (miniBoss.health <= 0) {
//                 miniBoss = null;
//                 level++;
//                 currentWave = 1; // Reset waves
//                 enemiesPerWave = 5; // Reset enemy count
//                 enemiesDestroyed = 0;
//                 bossSpawned = false;
//             }
//         }
//     });

//     enemyBullets.forEach((bullet, bulletIndex) => {
//         if (bullet.x < player.x + player.width &&
//             bullet.x + bullet.width > player.x &&
//             bullet.y < player.y + player.height &&
//             bullet.y + bullet.height > player.y) {
//             player.lives -= 1;
//             enemyBullets.splice(bulletIndex, 1);
//             if (player.lives <= 0) {
//                 alert("Game Over!");
//                 location.reload();
//             }
//         }
//     });

//     // Handle Wave & Boss Spawning
//     if (enemies.length === 0 && !waitingForNextWave) {
//         waitingForNextWave = true;

//         if (enemiesDestroyed >= 20) {
//             spawnMiniBoss(); // Spawn boss if 20+ enemies were killed
//         } else {
//             nextWave(); // Otherwise, spawn the next wave
//         }
//     }
// }

function handlePlayerInvulnerability() {
    player.invulnerable = true; // Disable collision detection
    player.invulnerabilityTimer = 600; // 10 seconds at 60 FPS

    // Use a timeout to re-enable collision detection after 10 seconds
    setTimeout(() => {
        player.invulnerable = false; // Re-enable collision detection
    }, 10000); // 10 seconds in milliseconds
}


// Update collision logic to play sound when an entity is destroyed (ORIGINAL WITHOUT POWERUPS)
// function checkCollisions() {
//     player.bullets.forEach((bullet, bulletIndex) => {
//         enemies.forEach((enemy, enemyIndex) => {
//             if (
//                 bullet.x < enemy.x + enemy.width &&
//                 bullet.x + bullet.width > enemy.x &&
//                 bullet.y < enemy.y + enemy.height &&
//                 bullet.y + bullet.height > enemy.y
//             ) {
//                 enemy.health -= 2; // Increase damage dealt by player bullets
//                 if (enemy.health <= 0) {
//                     createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "red"); // Explosion for enemy
//                     enemies.splice(enemyIndex, 1);
//                     enemiesDestroyed++;
//                     score += 100; // Increase score
//                     updateHUD(); // Update the HUD
//                     playExplosionSound(); // Play explosion sound
//                 }
//                 player.bullets.splice(bulletIndex, 1);
//             }
//         });

//         // Mini-Boss takes damage
//         if (miniBoss && bullet.x < miniBoss.x + miniBoss.width &&
//             bullet.x + bullet.width > miniBoss.x &&
//             bullet.y < miniBoss.y + miniBoss.height &&
//             bullet.y + bullet.height > miniBoss.y) {
            
//             miniBoss.health -= 2; // Increase damage dealt to the mini-boss
//             miniBoss.hit = true;
//             player.bullets.splice(bulletIndex, 1);

//             if (miniBoss.health <= 0) {
//                 createExplosion(miniBoss.x + miniBoss.width / 2, miniBoss.y + miniBoss.height / 2, "purple"); // Explosion for miniboss
//                 miniBoss = null;
//                 level++;
//                 currentWave = 1;
//                 enemiesPerWave = 5;
//                 enemiesDestroyed = 0;
//                 bossSpawned = false;
//                 updateHUD(); // Update the HUD
//                 playExplosionSound(); // Play explosion sound
//             }
//         }
//     });

//     enemyBullets.forEach((bullet, bulletIndex) => {
//         if (
//             !player.invulnerable && // Only check collision if the player is not invulnerable
//             bullet.x < player.x + player.width &&
//             bullet.x + bullet.width > player.x &&
//             bullet.y < player.y + player.height &&
//             bullet.y + bullet.height > player.y
//         ) {
//             createExplosion(player.x + player.width / 2, player.y + player.height / 2, "yellow"); // Explosion for player
//             playerHealth -= 1; // Decrease health
//             updateHUD(); // Update the HUD
//             enemyBullets.splice(bulletIndex, 1);
//             playExplosionSound(); // Play explosion sound
    
//             if (playerHealth <= 0) {
//                 alert("Game Over!");
//                 location.reload();
//             } else {
//                 handlePlayerInvulnerability(); // Call the new function
//             }
//         }
//     });

//     // Handle Wave & Boss Spawning
//     if (enemies.length === 0 && !waitingForNextWave) {
//         waitingForNextWave = true;

//         if (enemiesDestroyed >= 20) {
//             spawnMiniBoss();
//         } else {
//             nextWave();
//         }
//     }
// }


// **Check Collisions** (Modified for Power-Ups and Invulnerability)
function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemy.health -= 2;
                if (enemy.health <= 0) {
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "red");
                    enemies.splice(enemyIndex, 1);
                    enemiesDestroyed++;
                    score += 100;
                    updateHUD();
                    playExplosionSound();

                    // Spawn a power-up at the enemy's position
                    if (Math.random() < 0.2) { // 20% chance to spawn a power-up
                        spawnPowerUp(enemy.x, enemy.y);
                    }
                }
                player.bullets.splice(bulletIndex, 1);
            }
        });
    });


    enemyBullets.forEach((bullet, bulletIndex) => {
        if (
            !player.invulnerable && // Only check collision if the player is not invulnerable
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, "yellow"); // Explosion for player
            playerHealth -= 1; // Decrease health
            updateHUD(); // Update the HUD
            enemyBullets.splice(bulletIndex, 1);
            playExplosionSound(); // Play explosion sound
    
            if (playerHealth <= 0) {
                triggerSlowMotion();
                playDeathSequence();
                setTimeout(() => {
                    showGameOverScreen();
                }, 5000); // Wait for 5 seconds before showing the Game Over screen
            } else {
                handlePlayerInvulnerability(); // Call the new function

                // Remove dual shot upgrade if the player is hit
                if (player.shootingStyle === 2) {
                    player.shootingStyle = 1; // Revert to default shot
                }
            }
        }
    });

    // // Handle Wave & Boss Spawning
    // if (enemies.length === 0 && !waitingForNextWave) {
    //     waitingForNextWave = true;

    //     if (enemiesDestroyed >= 20) {
    //         spawnMiniBoss();
    //     } else {
    //         nextWave();
    //     }
    // }
}

// **Endless Waves System**
function nextWave() {
    currentWave++;
    level++; // Increment level
    enemiesPerWave = 5 + (level - 1) * 2; // Start with 5 enemies and add 2 more per level
    updateHUD(); // Update the HUD to reflect the new level

    setTimeout(() => {
        createEnemies(); // Spawn the next wave
        waitingForNextWave = false; // Reset the flag after spawning the wave
    }, 2000); // Delay before spawning the next wave
}

// Player Cutscene
function startCutscene() {
    startBackgroundMusic(); // Start the background music
    
    let cutsceneInterval = setInterval(() => {
        if (player.y > SCREEN_HEIGHT - 4 * TILE_SIZE) {
            player.y -= TILE_SIZE / 4;
        } else {
            clearInterval(cutsceneInterval);
            cutsceneComplete = true;
            setTimeout(() => {
                gameStarted = true;
                createEnemies();
            }, 10000);
        }
    }, 30);
}

let playerCanShoot = true; // Track if the player can shoot
let playerFireRate = 50; // Fire rate in milliseconds (doubled rate of fire)

// Function to find the nearest enemy for homing missiles
function findNearestEnemy() {
    if (enemies.length === 0) return null;
    return enemies.reduce((nearest, enemy) => {
        const distanceToCurrent = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        const distanceToNearest = Math.hypot(player.x - nearest.x, player.y - nearest.y);
        return distanceToCurrent < distanceToNearest ? enemy : nearest;
    });
}

// Function to shoot bullets (Modified for homing missiles)
// Update the shoot function to handle different styles
function shoot() {
    if (!playerCanShoot) return;

    if (player.shootingStyle === 1) {
        // Beginner Mode: Default Shot
        player.bullets.push({
            x: player.x + player.width / 2 - 6,
            y: player.y,
            width: 12,
            height: 30,
        });
    } else if (player.shootingStyle === 2) {
        // Dual Shot
        player.bullets.push(
            { x: player.x + player.width / 4 - 6, y: player.y, width: 12, height: 30 },
            { x: player.x + (3 * player.width) / 4 - 6, y: player.y, width: 12, height: 30 }
        );
    } else if (player.shootingStyle === 3) {
        // Triple Projectile & Double Fire Rate
        player.bullets.push(
            { x: player.x + player.width / 2 - 6, y: player.y, width: 12, height: 30 },
            { x: player.x + player.width / 2 - 20, y: player.y, width: 12, height: 30 },
            { x: player.x + player.width / 2 + 8, y: player.y, width: 12, height: 30 }
        );
    }

    playerCanShoot = false;
    setTimeout(() => {
        playerCanShoot = true;
    }, playerFireRate);
}


// // Function to shoot bullets (Original)
// function shoot() {
//     if (!playerCanShoot) return;

//     // Add a bullet to the player's bullets array
//     player.bullets.push({
//         x: player.x + player.width / 2 - 2,
//         y: player.y,
//         width: 4,
//         height: 10,
//     });

//     // Play the shooting sound effect
//     playerShootSound.currentTime = 0; // Reset the sound to the beginning
//     playerShootSound.play();

//     playerCanShoot = false; // Prevent shooting until cooldown ends
//     setTimeout(() => {
//         playerCanShoot = true; // Allow shooting again
//     }, playerFireRate);
// }

// // Game Loop (Working)
// function gameLoop() {
//     ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
//     drawPlayer(); // Draw player sprite
//     requestAnimationFrame(gameLoop); // Loop animation
//     drawEnemies();
//     drawMiniBoss();
//     drawBullets();
//     updateBullets();
//     moveEnemies();
//     moveMiniBoss();
//     checkCollisions();
//     frameCount++;
// }

// Add a power-ups array
let powerUps = [];

// **Game Loop** (Original without powerUps)
// function gameLoop() {
//     ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
//     // Handle player invulnerability
//     if (player.invulnerable) {
//         player.invulnerabilityTimer--;
//         if (player.invulnerabilityTimer <= 0) {
//             player.invulnerable = false; // Reset invulnerability
//         }
//     }

//     drawPlayer();
//     drawEnemies();
//     moveEnemies();
//     drawBullets();
//     updateBullets();
//     checkCollisions();
//     updateParticles(); // Update and draw particles

//     // Check if all enemies are destroyed
//     if (enemies.length === 0 && !waitingForNextWave) {
//         waitingForNextWave = true;
//         nextWave(); // Spawn the next wave
//     }

//     frameCount++;
//     requestAnimationFrame(gameLoop);
// }


// **Game Loop** (Modified to include power-ups)
// Update the game loop
function gameLoop() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

     // Draw and update the starfield
     drawStars();
     updateStars();

    // Handle player invulnerability
    if (player.invulnerable) {
        player.invulnerabilityTimer--;
        if (player.invulnerabilityTimer <= 0) {
            player.invulnerable = false;
        }
    }

    drawPlayer();
    drawEnemies();
    moveEnemies();
    drawBullets();
    updateBullets();
    checkCollisions();
    updateParticles();
    updatePowerUps(); // Update power-ups
    drawPowerUps(); // Draw power-ups

    // Check if all enemies are destroyed
    if (enemies.length === 0 && !waitingForNextWave) {
        waitingForNextWave = true;
        nextWave();
    }

    frameCount++;
    requestAnimationFrame(gameLoop);
}

// **Update Movement Logic to Use New Dimensions**
function movePlayer(direction) {
    if (!cutsceneComplete) return;

    player.moving = true;

    if (direction === "left" && player.x > 0) {
        player.x -= player.speed;
        player.sprite = playerLeftSprite;
    }
    if (direction === "right" && player.x < SCREEN_WIDTH - player.width) {
        player.x += player.speed;
        player.sprite = playerRightSprite;
    }
    if (direction === "up" && player.y > 0) player.y -= player.speed;
    // if (direction === "down" && player.y < SCREEN_HEIGHT - player.height) player.y += player.speed;
    
    if (direction === "down" && player.y < SCREEN_HEIGHT - player.height) {
        player.y += player.speed;
        player.sprite = playerDownSprite; // Switch to down animation
    }
}

// **Key Press Event**
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") movePlayer("left");
    if (event.key === "ArrowRight") movePlayer("right");
    if (event.key === "ArrowUp") movePlayer("up");
    if (event.key === "ArrowDown") movePlayer("down");
});

// **Key Release Event (Reset to Idle)**
document.addEventListener("keyup", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        player.moving = false;
        setTimeout(() => {
            if (!player.moving) {
                player.sprite = playerIdleSprite;
                player.frameX = 0;
            }
        }, 100);
    }
});

setInterval(shoot, 500);

// Initialize the starfield
createStars();

// Start Game
startCutscene();
gameLoop();



