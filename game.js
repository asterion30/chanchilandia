const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio (HTML5 Audio for file:// compatibility)
const backgroundMusic = new Audio('music/8-bit.wav');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.05;

const shootSound = new Audio('music/shoot.wav');
shootSound.volume = 0.55;
const oincSound = new Audio('music/oinc.wav');
oincSound.volume = 0.55;

let musicStarted = false;

function playMusic() {
    if (!musicStarted && backgroundMusic) {
        backgroundMusic.play().then(() => {
            console.log("Music started playing");
            musicStarted = true;
        }).catch(error => {
            console.error("Music playback failed:", error);
        });
    }
}

const volumeSlider = document.getElementById('volumeSlider');
if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        if (backgroundMusic) {
            backgroundMusic.volume = e.target.value;
        }
    });
}

// Game variables
// Game variables
let score = 0;
let gameRunning = false;
let currentLevel = 1;
let timer = 0;
let exitDoor = null;
let platforms = [];
let lastTime = 0;
let projectiles = [];
let enemyProjectiles = [];
let enemyShootTimer = 0;
let enemies = [];
let particles = [];

// Assets
const assets = {
    hunter: new Image(),
    hunterJumping: new Image(),
    hunterX: new Image(),
    pig: new Image(),
    axe: new Image(),
    impact: new Image()
};

let assetsLoaded = 0;
const totalAssets = Object.keys(assets).length;

function checkAssetsLoaded() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        console.log("All assets loaded. Starting game.");
        loadLevel(currentLevel);
    }
}

for (let key in assets) {
    assets[key].onload = () => {
        console.log(`${key.charAt(0).toUpperCase() + key.slice(1)} loaded successfully.`);
        checkAssetsLoaded();
    };
    assets[key].onerror = () => console.error(`Failed to load ${key}`);
    // FIX: Removed 'assets/' prefix as images are in the root directory
    assets[key].src = `${key === 'hunterX' ? 'Cazador-X' : (key === 'hunterJumping' ? 'CazadorSaltando' : (key === 'pig' ? 'cerdito' : (key === 'axe' ? 'axe' : (key === 'impact' ? 'impact' : 'Cazador'))))}.png`;
}

// Player
const player = {
    x: 50,
    y: 450,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 0.8,
    jumpPower: 15,
    isJumping: true,
    isAttacking: false,
    attackTime: 0,
    attackDuration: 25,
    facing: 'right', // 'left' or 'right'
    jumpCount: 0,
    maxJumps: 2
};

const axe = { width: 70, height: 70 };
const pig = { width: 50, height: 50 };

const keys = {
    right: false,
    left: false,
    up: false,
    down: false,
    space: false
};

// Event Listeners
canvas.addEventListener('click', () => {
    console.log("Canvas clicked. Attempting to start music/game.");
    playMusic();
    if (!gameRunning) {
        loadLevel(currentLevel);
    }
});

document.addEventListener('keydown', (e) => {
    playMusic();
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key.toLowerCase() === 'x') keys.attack = true;

    if (e.key === ' ' || e.key === 'ArrowUp') {
        keys.up = true;
        if (gameRunning) {
            if (!player.isJumping) {
                player.dy = -player.jumpPower;
                player.isJumping = true;
                player.jumpCount = 1;
            } else if (player.jumpCount < player.maxJumps) {
                player.dy = -player.jumpPower;
                player.jumpCount++;
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === ' ' || e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key.toLowerCase() === 'x') keys.attack = false;
});

// Touch Controls
const touchMap = {
    'btn-left': 'left',
    'btn-right': 'right',
    'btn-down': 'down',
    'btn-jump': 'up',
    'btn-attack': 'attack'
};

Object.keys(touchMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        const key = touchMap[id];

        const handleStart = (e) => {
            e.preventDefault();
            playMusic();
            if (key === 'up') { // Jump logic
                keys.up = true;
                if (gameRunning) {
                    if (!player.isJumping) {
                        player.dy = -player.jumpPower;
                        player.isJumping = true;
                        player.jumpCount = 1;
                    } else if (player.jumpCount < player.maxJumps) {
                        player.dy = -player.jumpPower;
                        player.jumpCount++;
                    }
                }
            } else {
                keys[key] = true;
            }
        };

        const handleEnd = (e) => {
            e.preventDefault();
            if (key === 'up') {
                keys.up = false;
            } else {
                keys[key] = false;
            }
        };

        btn.addEventListener('touchstart', handleStart, { passive: false });
        btn.addEventListener('touchend', handleEnd, { passive: false });
        btn.addEventListener('mousedown', handleStart);
        btn.addEventListener('mouseup', handleEnd);
        btn.addEventListener('mouseleave', handleEnd);
    }
});

function gameOver() {
    gameRunning = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '50px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'white';
    ctx.font = '30px "Courier New", Courier, monospace';
    ctx.fillText('Click to Retry', canvas.width / 2, canvas.height / 2 + 50);
}

function loadLevel(levelIndex) {
    if (levelIndex >= 100) { // MAX_LEVELS
        console.log("You beat all levels!");
        ctx.fillStyle = 'gold';
        ctx.font = '40px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '20px "Courier New", Courier, monospace';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
        gameRunning = false;
        return;
    }

    // Reset level state
    timer = 0;
    exitDoor = null; // Fix Bug 1: Reset exit door

    projectiles = [];
    enemyProjectiles = [];
    particles = [];
    // score = 0; // Don't reset score on level load? Step 326 reset it.

    const level = generateLevel(levelIndex);
    platforms = level.platforms;
    // pigs logic...
    enemies = level.pigs.map(p => ({
        ...p,
        width: 45,
        height: 35,
        growTimer: 0,
        growCount: 0,
        dx: 2, // Default speed
        patrolStartX: p.x - 100,
        patrolEndX: p.x + 100
    }));

    player.x = 100;
    player.y = 400;
    player.dy = 0;
    player.isJumping = true;

    if (!gameRunning) {
        gameRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

function updatePlayer() {
    if (!gameRunning) return;

    if (keys.right) {
        player.dx = player.speed;
        player.facing = 'right';
    } else if (keys.left) {
        player.dx = -player.speed;
        player.facing = 'left';
    } else {
        player.dx = 0;
    }

    // Jump logic moved to keydown event for double jump support
    // if (keys.up && !player.isJumping) {
    //    player.dy = -player.jumpPower;
    //    player.isJumping = true;
    // }

    if (keys.attack && !player.isAttacking) {
        player.isAttacking = true;
        player.attackTime = player.attackDuration;

        // Spawn projectile
        projectiles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            width: 32,
            height: 32,
            dx: player.facing === 'right' ? 10 : -10,
            dy: -2,
            rotation: 0
        });

        // Play shoot sound
        if (shootSound) {
            shootSound.currentTime = 0;
            shootSound.play().catch(e => console.error("Error playing shoot sound:", e));
        }
    }

    if (player.isAttacking) {
        player.attackTime--;
        if (player.attackTime <= 0) player.isAttacking = false;
    }

    player.x += player.dx;
    player.y += player.dy;
    player.dy += player.gravity;

    let onPlatform = false;
    platforms.forEach(platform => {
        // Fix Bug 2: Allow dropping down with Down Arrow (except ground at y=550)
        const allowDrop = keys.down && platform.y < 550;

        if (!allowDrop &&
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height >= platform.y &&
            player.y + player.height < platform.y + platform.height + player.dy) {
            player.y = platform.y - player.height;
            player.dy = 0;
            player.isJumping = false;
            player.jumpCount = 0; // Reset double jump
            onPlatform = true;
        }
    });
    if (!onPlatform) player.isJumping = true;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Exit door logic (needs exitDoor variable)
    if (typeof exitDoor !== 'undefined' && exitDoor &&
        player.x < exitDoor.x + exitDoor.width &&
        player.x + player.width > exitDoor.x &&
        player.y < exitDoor.y + exitDoor.height &&
        player.y + player.height > exitDoor.y) {
        currentLevel++;
        loadLevel(currentLevel);
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.2; // Gravity for axe
        p.rotation += 0.2;

        if (p.x < 0 || p.x > canvas.width || p.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }

        // Collision with pigs (enemies)
        for (let j = enemies.length - 1; j >= 0; j--) {
            const pig = enemies[j];
            if (p.x < pig.x + pig.width &&
                p.x + p.width > pig.x &&
                p.y < pig.y + pig.height &&
                p.y + p.height > pig.y) {

                // Create impact effect
                particles.push({
                    x: pig.x + pig.width / 2,
                    y: pig.y + pig.height / 2,
                    life: 20
                });

                enemies.splice(j, 1);
                projectiles.splice(i, 1);
                score += 10;

                // Play oinc sound
                if (oincSound) {
                    oincSound.currentTime = 0;
                    oincSound.play().catch(e => console.error("Error playing oinc sound:", e));
                }

                if (enemies.length === 0) {
                    // Define exitDoor globally
                    exitDoor = {
                        x: canvas.width - 80,
                        y: canvas.height - 120,
                        width: 60,
                        height: 70,
                        color: 'gold'
                    };
                }
                break;
            }
        }
    }
}

function updateEnemyProjectiles() {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width || p.y > canvas.height) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        // Collision with player
        if (p.x < player.x + player.width &&
            p.x + p.width > player.x &&
            p.y < player.y + player.height &&
            p.y + p.height > player.y) {
            gameOver();
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].life--;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePigs() {
    if (!gameRunning) return;

    enemies.forEach((pig, pigIndex) => {
        pig.x += pig.dx;

        if (pig.x < pig.patrolStartX || (pig.x + pig.width) > pig.patrolEndX) {
            pig.dx *= -1;
        }

        pig.growTimer++;
        if (pig.growTimer >= 180) { // 3 seconds at 60fps
            pig.growTimer = 0;
            pig.growCount++;
            pig.width *= 1.2;
            pig.height *= 1.2;
            if (pig.growCount >= 5) {
                gameOver();
            }
        }
        if (pig.growCount >= 5) {
            gameOver();
        }

        if (pig.growCount >= 5) {
            gameOver();
        }
    });

    // Feature: Enemy Shooting (Level 10+) - Global Timer
    if (currentLevel >= 10 && enemies.length > 0) {
        enemyShootTimer++;
        // 2 shots every 5 seconds = 1 shot every 2.5 seconds = 150 frames
        if (enemyShootTimer >= 150) {
            enemyShootTimer = 0;

            // Pick a random pig
            const randomPigIndex = Math.floor(Math.random() * enemies.length);
            const pig = enemies[randomPigIndex];

            // Aim at player
            const angle = Math.atan2(player.y - pig.y, player.x - pig.x);
            const speed = 4;

            enemyProjectiles.push({
                x: pig.x + pig.width / 2,
                y: pig.y + pig.height / 2,
                width: 10,
                height: 10,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                color: 'red'
            });
        }
    }
}

function draw() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (typeof platforms !== 'undefined') {
        platforms.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
        });
    }

    if (typeof exitDoor !== 'undefined' && exitDoor) {
        ctx.fillStyle = exitDoor.color;
        ctx.fillRect(exitDoor.x, exitDoor.y, exitDoor.width, exitDoor.height);
    }

    let playerSprite = assets.hunter;
    let spriteFacesRight = false; // Default: sprites face Left

    if (player.isAttacking) {
        playerSprite = assets.hunterX;
        spriteFacesRight = true; // Cazador-X faces Right
    } else if (player.isJumping) {
        playerSprite = assets.hunterJumping;
    }

    ctx.save();
    const facingRight = (player.facing === 'right');
    // Flip if the desired direction (facingRight) is different from the sprite's native direction
    if (facingRight !== spriteFacesRight) {
        ctx.translate(player.x + player.width, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(playerSprite, 0, 0, player.width, player.height);
    } else {
        ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
    }
    ctx.restore();

    // Draw Projectiles
    projectiles.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate(p.rotation);
        ctx.drawImage(assets.axe, -p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
    });

    // Draw Enemy Projectiles
    enemyProjectiles.forEach(p => {
        ctx.fillStyle = p.color || 'red';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.drawImage(assets.impact, p.x - 16, p.y - 16, 32, 32);
    });

    enemies.forEach(pig => {
        ctx.save();
        const pigAngle = Math.sin(timer * 0.05) * 0.25;
        ctx.translate(pig.x + pig.width / 2, pig.y + pig.height / 2);
        ctx.rotate(pigAngle);
        ctx.drawImage(assets.pig, -pig.width / 2, -pig.height / 2, pig.width, pig.height);
        ctx.restore();
    });

    ctx.fillStyle = 'white';
    ctx.font = '24px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${currentLevel}`, canvas.width - 250, 30);
}

function gameLoop(timestamp) {
    if (!gameRunning) {
        return;
    }
    updatePlayer();
    updateProjectiles();
    updateEnemyProjectiles();
    updateParticles();
    updatePigs();
    draw();
    requestAnimationFrame(gameLoop);
}