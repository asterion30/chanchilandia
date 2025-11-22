
function generateLevel(levelNumber) {
    const platforms = [];
    const pigs = [];
    const TILE_SIZE = 50;
    const canvasWidth = 800; // Assuming canvas width is 800
    const canvasHeight = 600; // Assuming canvas height is 600

    // --- 1. Create Ground ---
    platforms.push({ x: 0, y: 550, width: canvasWidth, height: 50, color: '#228b22' });

    // --- 2. Generate Platforms ---
    let platformCount = Math.min(5 + levelNumber, 20);
    let lastY = 550;

    for (let i = 0; i < platformCount; i++) {
        const width = Math.max(80, 250 - levelNumber * 5);
        const x = Math.random() * (canvasWidth - width);
        
        // Ensure platforms are placed within the screen and progressively higher
        const y = Math.max(100, lastY - (80 + Math.random() * 40));

        platforms.push({ x, y, width, height: 20, color: '#8b4513' });
        lastY = y;
    }

    // --- 3. Place Pigs on Platforms ---
    // Increase pigs by 2 each level, with a max of 30
    let pigCount = Math.min(2 + levelNumber * 2, 30);
    const availablePlatforms = platforms.slice(1); // Exclude ground platform

    for (let i = 0; i < pigCount; i++) {
        if (availablePlatforms.length === 0) break; // No more platforms to place pigs on

        // Pick a random platform
        const platformIndex = Math.floor(Math.random() * availablePlatforms.length);
        const platform = availablePlatforms[platformIndex];

        // Ensure platform is valid before placing pig
        if (platform && platform.y > 50) { // Basic check to avoid placing pigs too high
            const pigX = platform.x + (platform.width / 2) - 22; // Center the pig
            const pigY = platform.y - 35; // 35 is pig height
            const speed = 1 + Math.random() * (levelNumber / 10);

            pigs.push({
                x: pigX,
                y: pigY,
                dx: speed * (Math.random() < 0.5 ? 1 : -1),
                patrolStartX: platform.x,
                patrolEndX: platform.x + platform.width
            });

            // Remove the platform from the available list to avoid placing multiple pigs on the same one
            availablePlatforms.splice(platformIndex, 1);
        } else {
            i--; // Try again if the platform was not valid
        }
    }

    return { platforms, pigs };
}
