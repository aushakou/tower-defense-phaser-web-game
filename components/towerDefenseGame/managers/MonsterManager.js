export default class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.spawnTimer = null;
  }
  
  spawnMonster() {
    if (!this.scene.isGameRunning) return;
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / this.scene.GRID_COLS : adjustedHeight / this.scene.GRID_ROWS;
    
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
    
    // Add monster data
    const monsterData = {
      gameObject: monster,
      hp: 100,
      maxHp: 100,
      path: path,
      currentPathIndex: 0,
      speed: 1, // Cells per second
      startTime: this.scene.time.now,
      position: { row: startRow, col: startCol }
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
    if (this.spawnTimer) return;
    
    // Spawn first monster immediately
    this.spawnMonster();
    
    // Set up timer for spawning monsters every 10 seconds
    this.spawnTimer = this.scene.time.addEvent({
      delay: 10000,
      callback: this.spawnMonster,
      callbackScope: this,
      loop: true
    });
  }
  
  stopSpawning() {
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
  }
  
  monsterReachedEnd(monster) {
    // Reduce player health by 20 points
    this.scene.game.takeDamage(20);
    
    // Create a flash effect to indicate damage
    const flashEffect = this.scene.add.rectangle(
      0, 0, 
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
    // Update monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      
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
  
  getMonsters() {
    return this.monsters;
  }
} 