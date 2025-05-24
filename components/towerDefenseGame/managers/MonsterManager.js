import Monster from '../entities/Monster.js';

export default class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.spawnTimer = null;
    this.baseSpawnDelay = 10000; // Base spawn delay in ms (10 seconds)
    this.currentSpawnDelay = 10000; // Current spawn delay, affected by game speed
    this.spawnTimeElapsed = 0; // Track elapsed time for manual spawning
    this.lastSpawnTime = 0; // Last time a monster was spawned
    this.maxMonsters = 30; // Performance optimization: Limit max number of monsters
  }
  
  spawnMonster() {
    if (!this.scene.isGameRunning) return;
    
    // Performance optimization: Limit the number of monsters
    if (this.monsters.length >= this.maxMonsters) {
      // Too many monsters, remove the oldest one if it's not near the end
      let oldestMonster = null;
      let oldestIndex = -1;
      
      for (let i = 0; i < this.monsters.length; i++) {
        const monster = this.monsters[i];
        // Skip monsters that are near the end (progress > 80%)
        if (monster && monster.currentPathIndex > 0 && 
            monster.path && monster.path.length > 0 &&
            monster.currentPathIndex > 0.8 * monster.path.length) {
          continue;
        }
        
        oldestMonster = monster;
        oldestIndex = i;
        break;
      }
      
      // Remove the oldest monster if found
      if (oldestIndex >= 0 && oldestMonster) {
        if (typeof oldestMonster.destroy === 'function') {
          oldestMonster.destroy();
        } else {
          // Fallback cleanup
          if (oldestMonster.gameObject) oldestMonster.gameObject.destroy();
          if (oldestMonster.hpBar) oldestMonster.hpBar.destroy();
          if (oldestMonster.hpBarBg) oldestMonster.hpBarBg.destroy();
          if (oldestMonster.hpText) oldestMonster.hpText.destroy();
        }
        this.monsters.splice(oldestIndex, 1);
      }
      
      // If we still have too many monsters, skip spawning
      if (this.monsters.length >= this.maxMonsters) {
        return null;
      }
    }
    
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
    
    // Performance optimization: Don't recalculate paths every time
    // Only recalculate path if it's been more than 5 seconds since last recalculation
    const currentTime = this.scene.time.now;
    if (!this.lastPathRecalculationTime || currentTime - this.lastPathRecalculationTime > 5000) {
      this.scene.pathManager.recalculatePaths();
      this.lastPathRecalculationTime = currentTime;
    }
    
    // Calculate path using pathfinding
    const path = this.scene.pathManager.findPath(
      { row: startRow, col: startCol }, 
      { row: endRow, col: endCol }
    );
    
    if (!path || path.length === 0) {
      console.error("No path found for monster! The end might be blocked by towers.");
      return;
    }
    
    // Get current game speed
    const gameSpeed = this.scene.ui.gameSpeed || 1;
    
    // Create a new monster using the Monster class
    const monster = new Monster(this.scene, {
      x: spawnX,
      y: spawnY,
      hp: 100,
      maxHp: 100,
      speed: 0.5 * gameSpeed, // Apply game speed to new monsters
      path: path,
      startRow: startRow,
      startCol: startCol
    });
    
    // Add monster to the array
    this.monsters.push(monster);
    
    // Update path visualization if grid is visible - but don't do it too often
    if (this.scene.gridVisible && this.scene.ui && 
        (!this.lastPathVisualization || currentTime - this.lastPathVisualization > 5000)) {
      this.scene.ui.updatePathVisualization();
      this.lastPathVisualization = currentTime;
    }
    
    return monster;
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
    // Call the Monster class's destroy method for each monster
    this.monsters.forEach(monster => {
      if (monster && typeof monster.destroy === 'function') {
        monster.destroy();
      } else {
        // Fallback for old monster objects
        if (monster.gameObject) monster.gameObject.destroy();
        if (monster.hpBar) monster.hpBar.destroy();
        if (monster.hpBarBg) monster.hpBarBg.destroy();
        if (monster.hpText) monster.hpText.destroy();
      }
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
    
    // Mark the monster for removal
    monster.reachedEnd = true;
    
    // If it's a Monster class instance with a destroy method, use it
    if (typeof monster.destroy === 'function') {
      // The destroy method will clean up gameObject, hpBar, etc.
      monster.destroy();
    } else {
      // Fallback for old monster objects
      // Remove monster and its HP bar
      if (monster.gameObject) monster.gameObject.destroy();
      if (monster.hpBar) monster.hpBar.destroy();
      if (monster.hpBarBg) monster.hpBarBg.destroy();
      if (monster.hpText) monster.hpText.destroy();
    }
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
    
    // Performance optimization: Only update every other monster on each frame if there are many
    const updateEveryOther = this.monsters.length > 15;
    let skipCounter = 0;
    
    // Update monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      
      // Skip if monster is invalid
      if (!monster) {
        this.monsters.splice(i, 1);
        continue;
      }
      
      // Performance optimization: Skip every other monster update when there are many
      if (updateEveryOther) {
        skipCounter++;
        if (skipCounter % 2 === 0 && i > 5) {
          continue; // Skip this monster for this frame
        }
      }
      
      // If monster has its own update method (new implementation)
      if (typeof monster.update === 'function') {
        monster.update(delta);
        
        // Check if monster is dead or has reached the end
        if (monster.hp <= 0 || monster.reachedEnd) {
          // If monster was killed by towers (not by reaching the end)
          if (monster.hp <= 0 && !monster.reachedEnd) {
            // Add score and money rewards
            this.scene.game.monsterKilled();
          }
          
          // Destroy the monster properly
          if (typeof monster.destroy === 'function') {
            monster.destroy();
          } else {
            // Fallback cleanup
            if (monster.gameObject) monster.gameObject.destroy();
            if (monster.hpBar) monster.hpBar.destroy();
            if (monster.hpBarBg) monster.hpBarBg.destroy();
            if (monster.hpText) monster.hpText.destroy();
          }
          
          // Remove from array
          this.monsters.splice(i, 1);
        }
      } 
      // Old implementation for backwards compatibility
      else {
        // Skip if monster is invalid or has reached the end
        if (!monster.gameObject || monster.reachedEnd) {
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
            if (monster.hpText) monster.hpText.destroy();
            
            // Add score and money rewards
            this.scene.game.monsterKilled();
          }
          
          // Remove from array in either case
          this.monsters.splice(i, 1);
        }
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
