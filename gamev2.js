// Game Configuration
        const config = {
            gridSize: { width: 20, height: 20 },
            tileSize: 32,
            screenSize: { width: 640, height: 640 },
            playerSpeed: 5,
            bulletSpeed: 10,
            enemySpeed: 2
        };

        // Game State
        const gameState = {
            score: 0,
            lives: 3,
            currentLevel: 1,
            enemies: [],
            playerBullets: [],
            enemyBullets: []
        };

        // Game Elements
        const gameContainer = document.getElementById('gameContainer');
        const player = document.getElementById('player');
        const scoreDisplay = document.getElementById('scoreDisplay');
        const livesDisplay = document.getElementById('livesDisplay');
        const levelDisplay = document.getElementById('levelDisplay');

        // Player Movement
        function handlePlayerMovement(e) {
            const playerRect = player.getBoundingClientRect();
            switch(e.key) {
                case 'ArrowLeft':
                    player.style.left = `${Math.max(0, playerRect.left - config.playerSpeed)}px`;
                    break;
                case 'ArrowRight':
                    player.style.left = `${Math.min(config.screenSize.width - 32, playerRect.left + config.playerSpeed)}px`;
                    break;
                case 'ArrowUp':
                    player.style.bottom = `${Math.min(20, parseInt(player.style.bottom || '20') + config.playerSpeed)}px`;
                    break;
                case 'ArrowDown':
                    player.style.bottom = `${Math.max(0, parseInt(player.style.bottom || '20') - config.playerSpeed)}px`;
                    break;
            }
        }

        // Spawn Enemies
        function spawnEnemies(count) {
            for (let i = 0; i < count; i++) {
                const enemy = document.createElement('div');
                enemy.classList.add('enemy');
                enemy.style.top = `${-i * 50}px`;
                enemy.style.left = `${Math.random() * (config.screenSize.width - 32)}px`;
                gameContainer.appendChild(enemy);
                gameState.enemies.push(enemy);
            }
        }

        // Enemy Movement
        function moveEnemies() {
            gameState.enemies.forEach(enemy => {
                const currentTop = parseInt(enemy.style.top || '0');
                enemy.style.top = `${currentTop + config.enemySpeed}px`;

                // Random enemy shooting
                if (Math.random() < 0.02) {
                    const enemyBullet = document.createElement('div');
                    enemyBullet.classList.add('bullet');
                    enemyBullet.style.backgroundColor = 'red';
                    enemyBullet.style.top = `${currentTop + 32}px`;
                    enemyBullet.style.left = `${parseInt(enemy.style.left) + 16}px`;
                    gameContainer.appendChild(enemyBullet);
                    gameState.enemyBullets.push(enemyBullet);
                }
            });
        }

        // Player Shooting
        function playerShoot() {
            const playerRect = player.getBoundingClientRect();
            const bullet = document.createElement('div');
            bullet.classList.add('bullet');
            bullet.style.left = `${playerRect.left + 14}px`;
            bullet.style.bottom = '52px';
            gameContainer.appendChild(bullet);
            gameState.playerBullets.push(bullet);
        }

        // Update Bullets
        function updateBullets() {
            // Player bullets move up
            gameState.playerBullets.forEach((bullet, index) => {
                const currentBottom = parseInt(bullet.style.bottom || '0');
                bullet.style.bottom = `${currentBottom + config.bulletSpeed}px`;

                // Check for enemy collision
                gameState.enemies.forEach((enemy, enemyIndex) => {
                    if (isColliding(bullet, enemy)) {
                        gameContainer.removeChild(bullet);
                        gameContainer.removeChild(enemy);
                        gameState.playerBullets.splice(index, 1);
                        gameState.enemies.splice(enemyIndex, 1);
                        gameState.score += 10;
                        scoreDisplay.textContent = `Score: ${gameState.score}`;
                    }
                });

                // Remove bullets that go off screen
                if (currentBottom > config.screenSize.height) {
                    gameContainer.removeChild(bullet);
                    gameState.playerBullets.splice(index, 1);
                }
            });

            // Enemy bullets move down
            gameState.enemyBullets.forEach((bullet, index) => {
                const currentTop = parseInt(bullet.style.top || '0');
                bullet.style.top = `${currentTop + config.bulletSpeed}px`;

                // Check for player collision
                if (isColliding(bullet, player)) {
                    gameContainer.removeChild(bullet);
                    gameState.enemyBullets.splice(index, 1);
                    gameState.lives--;
                    livesDisplay.textContent = `Lives: ${gameState.lives}`;

                    if (gameState.lives <= 0) {
                        gameOver();
                    }
                }

                // Remove bullets that go off screen
                if (currentTop > config.screenSize.height) {
                    gameContainer.removeChild(bullet);
                    gameState.enemyBullets.splice(index, 1);
                }
            });
        }

        // Collision Detection
        function isColliding(a, b) {
            const aRect = a.getBoundingClientRect();
            const bRect = b.getBoundingClientRect();
            return !(
                aRect.top > bRect.bottom ||
                aRect.right < bRect.left ||
                aRect.bottom < bRect.top ||
                aRect.left > bRect.right
            );
        }

        // Level Management
        function startLevel() {
            const enemyCount = gameState.currentLevel * 10;
            spawnEnemies(enemyCount);
            levelDisplay.textContent = `Level: ${gameState.currentLevel}`;
        }

        // Game Over
        function gameOver() {
            alert(`Game Over! Your Score: ${gameState.score}`);
            resetGame();
        }

        // Reset Game
        function resetGame() {
            gameState.score = 0;
            gameState.lives = 3;
            gameState.currentLevel = 1;
            scoreDisplay.textContent = 'Score: 0';
            livesDisplay.textContent = 'Lives: 3';
            levelDisplay.textContent = 'Level: 1';

            // Remove all existing enemies and bullets
            gameState.enemies.forEach(enemy => gameContainer.removeChild(enemy));
            gameState.playerBullets.forEach(bullet => gameContainer.removeChild(bullet));
            gameState.enemyBullets.forEach(bullet => gameContainer.removeChild(bullet));
            
            gameState.enemies = [];
            gameState.playerBullets = [];
            gameState.enemyBullets = [];

            startLevel();
        }

        // Game Loop
        function gameLoop() {
            moveEnemies();
            updateBullets();

            // Check if all enemies are destroyed
            if (gameState.enemies.length === 0) {
                gameState.currentLevel++;
                if (gameState.currentLevel > 5) {
                    alert('Congratulations! You saved Earth!');
                    resetGame();
                } else {
                    startLevel();
                }
            }

            requestAnimationFrame(gameLoop);
        }

        // Event Listeners
        document.addEventListener('keydown', handlePlayerMovement);
        setInterval(playerShoot, 500); // Automatic shooting

        // Start the game
        startLevel();
        gameLoop();
