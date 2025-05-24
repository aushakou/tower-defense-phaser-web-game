export default class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.spawnTimer = null;
    this.baseSpawnDelay = 10000; // Base spawn delay in ms (10 seconds)
    this.currentSpawnDelay = 10000; // Current spawn delay, affected by game speed
    this.spawnTimeElapsed = 0; // Track elapsed time for manual spawning
    this.lastSpawnTime = 0; // Last time a monster was spawned
  }
  
  spawnMonster() {
    if (!this.scene.isGameRunning) return;
    
    // Use the constant cell size
    const cellSize = this.scene.CELL_SIZE;
    
    // Get bottom middle cell
    const startCol = Math.floor(this.scene.GRID_COLS / 2);
    const startRow = this.scene.GRID_ROWS - 1;
    
    // Get top middle cell
    const endCol = Math.floor(this.scene.GRID_COLS / 2);
    const endRow = 0;
    
    // Spawn position (bottom middle)
    const spawnX = this.scene.gridOffsetX + startCol * cellSize + cellSize / 2;
    const spawnY = this.scene.gridOffsetY + startRow * cellSize + cellSize / 2;
    
    // Make sure to clear the path cache before finding a new path
    // This ensures we get a fresh path considering any newly placed towers
    this.scene.pathManager.recalculatePaths();
    
    // Calculate path using pathfinding
    const path = this.scene.pathManager.findPath(
      { row: startRow, col: startCol }, 
      { row: endRow, col: endCol }
    );
    
    if (!path || path.length === 0) {
      console.error("No path found for monster! The end might be blocked by towers.");
      return;
    }
    
    // Create monster
    const scale = cellSize / 500; // Adjust this value based on your monster image size
    const monster = this.scene.add.image(spawnX, spawnY, 'monster')
      .setScale(scale)
      .setOrigin(0.5)
      .setDepth(20); // Set higher depth to appear in front of grid and path
    
    // Add monster data - apply current game speed from UIManager
    const baseSpeed = 0.5; // Base speed cells per second
    const gameSpeed = this.scene.ui.gameSpeed || 1; // Get current game speed, default to 1 if not set
    
    const monsterData = {
      gameObject: monster,
      hp: 100,
      maxHp: 100,
      path: path,
      currentPathIndex: 0,
      speed: baseSpeed * gameSpeed, // Apply game speed to new monsters
      startTime: this.scene.time.now,
      position: { row: startRow, col: startCol },
      baseSpeed: baseSpeed // Store the base speed for easy adjustment when game speed changes
    };
    
    // Create HP bar
    const hpBarWidth = cellSize * 0.8;
    const hpBarHeight = 5;
    const hpBarBg = this.scene.add.rectangle(
      monster.x, 
      monster.y - cellSize/2 - 10, 
      hpBarWidth, 
      hpBarHeight, 
      0x333333
    ).setOrigin(0.5, 0.5).setDepth(20); // Same depth as monster
    
    const hpBar = this.scene.add.rectangle(
      monster.x - hpBarWidth/2, 
      monster.y - cellSize/2 - 10, 
      hpBarWidth, 
      hpBarHeight, 
      0x00ff00
    ).setOrigin(0, 0.5).setDepth(21); // Slightly higher depth than background
    
    monsterData.hpBar = hpBar;
    monsterData.hpBarBg = hpBarBg;
    
    this.monsters.push(monsterData);
    
    // Update path visualization if grid is visible
    if (this.scene.gridVisible && this.scene.ui) {
      this.scene.ui.updatePathVisualization();
    }
    
    console.log("Monster spawned with path:", path);
    
    return monsterData;
  }
  
  startSpawning() {
    // Spawn first monster immediately
    this.spawnMonster();
    this.lastSpawnTime = this.scene.time.now;
  }
  
  stopSpawning() {
    this.spawnTimeElapsed = 0;
  }
  
  // Remove all monsters from the game
  removeAllMonsters() {
    // First destroy all monster game objects
    this.monsters.forEach(monster => {
      if (monster.gameObject) monster.gameObject.destroy();
      if (monster.hpBar) monster.hpBar.destroy();
      if (monster.hpBarBg) monster.hpBarBg.destroy();
    });
    
    // Then clear the monsters array
    this.monsters = [];
    
    console.log('All monsters removed from the game');
  }
  
  updateSpawnSpeed(speedFactor) {
    // Update the current spawn delay based on speed factor
    this.currentSpawnDelay = this.baseSpawnDelay / speedFactor;
    console.log(`Spawn delay updated to: ${this.currentSpawnDelay}ms`);
    
    // Also update the speed of all existing monsters to match the new game speed
    this.monsters.forEach(monster => {
      if (monster) {
        // Base speed for monster is 0.5 cells per second
        const baseSpeed = 0.5;
        monster.speed = baseSpeed * speedFactor;
      }
    });
  }
  
  monsterReachedEnd(monster) {
    // Reduce player health by 20 points
    this.scene.game.takeDamage(20);
    
    // Create a flash effect to indicate damage
    const flashEffect = this.scene.add.rectangle(
      this.scene.cameras.main.centerX, 
      this.scene.cameras.main.centerY, 
      this.scene.cameras.main.width, 
      this.scene.cameras.main.height, 
      0xff0000, 0.3
    );
    flashEffect.setDepth(100);
    
    // Make it disappear after a short time
    this.scene.tweens.add({
      targets: flashEffect,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        flashEffect.destroy();
      }
    });
    
    // Remove monster and its HP bar
    monster.gameObject.destroy();
    monster.hpBar.destroy();
    monster.hpBarBg.destroy();
    
    // Mark the monster for removal
    monster.reachedEnd = true;
  }
  
  updateMonsters(delta) {
    // Only proceed if game is running
    if (!this.scene.isGameRunning) return;
    
    // Handle monster spawning based on elapsed time
    const currentTime = this.scene.time.now;
    const timeSinceLastSpawn = currentTime - this.lastSpawnTime;
    
    // Check if it's time to spawn a new monster
    if (timeSinceLastSpawn >= this.currentSpawnDelay) {
      this.spawnMonster();
      this.lastSpawnTime = currentTime;
    }
    
    // Update monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      
      // Skip if monster is invalid or has reached the end
      if (!monster || !monster.gameObject || monster.reachedEnd) {
        continue;
      }
      
      // Skip monsters with no valid path
      if (!monster.path || monster.path.length === 0) {
        // Try to recalculate the path
        this.recalculateMonsterPath(monster);
        // If still no path, skip this monster
        if (!monster.path || monster.path.length === 0) {
          continue;
        }
      }
      
      // Update monster position
      this.scene.pathManager.updateMonsterPosition(monster, delta);
      
      // Check if monster is dead or has reached the end
      if (monster.hp <= 0 || monster.reachedEnd) {
        // If monster was killed by towers (not by reaching the end)
        if (monster.hp <= 0 && !monster.reachedEnd) {
          // Remove monster and its HP bar
          monster.gameObject.destroy();
          monster.hpBar.destroy();
          monster.hpBarBg.destroy();
          
          // Add score and money rewards
          this.scene.game.monsterKilled();
        }
        
        // Remove from array in either case
        this.monsters.splice(i, 1);
      }
    }
  }
  
  // Helper method to recalculate a monster's path
  recalculateMonsterPath(monster) {
    if (!monster || monster.reachedEnd) return;
    
    // Get end goal (typically top middle)
    const endCol = Math.floor(this.scene.GRID_COLS / 2);
    const endRow = 0;
    
    // Make sure we have a valid position
    if (!monster.position) {
      // If no position, use gameObject position to estimate grid position
      const cellSize = this.scene.CELL_SIZE;
      const gridX = Math.floor((monster.gameObject.x - this.scene.gridOffsetX) / cellSize);
      const gridY = Math.floor((monster.gameObject.y - this.scene.gridOffsetY) / cellSize);
      
      // Set position if valid
      if (gridX >= 0 && gridX < this.scene.GRID_COLS && 
          gridY >= 0 && gridY < this.scene.GRID_ROWS) {
        monster.position = { row: gridY, col: gridX };
      } else {
        // No valid position to calculate from
        return;
      }
    }
    
    // Calculate a new path from current position to goal
    const newPath = this.scene.pathManager.findPath(
      monster.position,
      { row: endRow, col: endCol }
    );
    
    // If a valid path was found, update the monster's path
    if (newPath && newPath.length > 0) {
      monster.path = newPath;
      monster.currentPathIndex = 0;
      
      // Log path recalculation for debugging
      console.log("Recalculated path for monster:", monster.position, "Path length:", newPath.length);
    }
  }
  
  getMonsters() {
    return this.monsters;
  }
}
