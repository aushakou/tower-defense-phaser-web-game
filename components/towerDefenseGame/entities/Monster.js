export default class Monster {
  constructor(scene, options) {
    this.scene = scene;
    this.hp = options.hp || 100;
    this.maxHp = options.maxHp || 100;
    this.speed = options.speed || 1; // Cells per second
    this.path = options.path || [];
    this.currentPathIndex = 0;
    this.position = { 
      row: options.startRow, 
      col: options.startCol 
    };
    this.startTime = scene.time.now;
    this.reachedEnd = false;
    
    const cellSize = scene.getCellSize();
    const scale = cellSize / 500; // Adjust based on monster image size
    
    // Create monster sprite
    this.gameObject = scene.add.image(options.x, options.y, 'monster')
      .setScale(scale)
      .setOrigin(0.5);
    
    // Create HP bar
    this.createHpBar(options.x, options.y, cellSize);
  }
  
  createHpBar(x, y, cellSize) {
    const hpBarWidth = cellSize * 0.8;
    const hpBarHeight = 5;
    
    this.hpBarBg = this.scene.add.rectangle(
      x, 
      y - cellSize/2 - 10, 
      hpBarWidth, 
      hpBarHeight, 
      0x333333
    ).setOrigin(0.5, 0.5);
    
    this.hpBar = this.scene.add.rectangle(
      x - hpBarWidth/2, 
      y - cellSize/2 - 10, 
      hpBarWidth, 
      hpBarHeight, 
      0x00ff00
    ).setOrigin(0, 0.5);
    
    // Add health text above the health bar
    this.hpText = this.scene.add.text(
      x,
      y - cellSize/2 - 20, // Position above the health bar
      `${this.hp}/${this.maxHp}`,
      {
        font: `${Math.max(10, Math.floor(cellSize/5))}px Arial`,
        fill: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5).setDepth(20);
  }
  
  takeDamage(amount) {
    // If monster is dead or destroyed, don't process damage
    if (this.hp <= 0 || this.reachedEnd || !this.gameObject || !this.gameObject.active) {
      return;
    }
    
    this.hp -= amount;
    
    // Guard against negative HP
    this.hp = Math.max(0, this.hp);
    
    // Only update UI elements if they exist and are active
    // Update HP bar
    if (this.hpBar && this.hpBar.active && this.hpBarBg && this.hpBarBg.active) {
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      this.hpBar.width = this.hpBarBg.width * hpRatio;
      
      // Change HP bar color based on health
      if (hpRatio < 0.3) {
        this.hpBar.fillColor = 0xff0000; // Red when low health
      } else if (hpRatio < 0.6) {
        this.hpBar.fillColor = 0xffff00; // Yellow when medium health
      }
    }
    
    // Update HP text only if it exists and is active
    if (this.hpText && this.hpText.active && !this.hpText.destroyed) {
      try {
        this.hpText.setText(`${Math.ceil(this.hp)}/${this.maxHp}`);
      } catch (e) {
        console.warn("Failed to update HP text", e);
        // If we encounter an error, destroy the text to prevent future errors
        if (this.hpText) {
          this.hpText.destroy();
          this.hpText = null;
        }
      }
    }
  }
  
  update(delta) {
    // Skip update if monster is dead, reached end, or has been destroyed
    if (this.hp <= 0 || this.reachedEnd || 
        this.destroyed || !this.gameObject || 
        !this.gameObject.active || 
        this.currentPathIndex >= this.path.length - 1) {
      return;
    }
    
    const cellSize = this.scene.getCellSize();
    
    // Calculate time-based movement
    const timeElapsed = delta / 10;
    const distanceToMove = this.speed * timeElapsed;
    
    // Current and next position in the path
    const current = this.path[this.currentPathIndex];
    const next = this.path[this.currentPathIndex + 1];
    
    // Verify we have valid path points
    if (!current || !next) {
      return;
    }
    
    // Calculate grid positions
    const currentX = this.scene.gridOffsetX + current.col * cellSize + cellSize / 2;
    const currentY = this.scene.gridOffsetY + current.row * cellSize + cellSize / 2;
    const nextX = this.scene.gridOffsetX + next.col * cellSize + cellSize / 2;
    const nextY = this.scene.gridOffsetY + next.row * cellSize + cellSize / 2;
    
    // Direction and distance
    const dx = nextX - currentX;
    const dy = nextY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // How far we can move this frame
    const ratio = Math.min(distanceToMove, distance) / distance;
    
    // Update position
    const newX = this.gameObject.x + dx * ratio;
    const newY = this.gameObject.y + dy * ratio;
    
    this.gameObject.x = newX;
    this.gameObject.y = newY;
    
    // Update HP bar position
    if (this.hpBar && this.hpBar.active && this.hpBarBg && this.hpBarBg.active) {
      this.hpBarBg.x = newX;
      this.hpBarBg.y = newY - cellSize/2 - 10;
      
      // Fix the HP bar positioning - it should be centered based on its current width
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      const fullWidth = this.hpBarBg.width;
      const currentWidth = fullWidth * hpRatio;
      this.hpBar.x = newX - fullWidth/2;
      this.hpBar.y = newY - cellSize/2 - 10;
      this.hpBar.width = currentWidth;
      
      // Update HP text position
      if (this.hpText && this.hpText.active) {
        this.hpText.x = newX;
        this.hpText.y = newY - cellSize/2 - 20;
      }
    }
    
    // If we've reached the next point in the path
    if (Math.abs(this.gameObject.x - nextX) < 2 && Math.abs(this.gameObject.y - nextY) < 2) {
      this.currentPathIndex++;
      this.position = { row: next.row, col: next.col };
      
      // Check if monster reached the end
      if (this.currentPathIndex >= this.path.length - 1) {
        this.reachedEnd = true;
        if (this.scene.monsterReachedEnd) {
          this.scene.monsterReachedEnd(this);
        }
      }
    }
  }
  
  destroy() {
    // Safe destroy function to handle potential null/undefined objects
    const safeDestroy = (obj) => {
      if (obj && !obj.destroyed) {
        try {
          obj.destroy();
        } catch (e) {
          console.warn("Error destroying object:", e);
        }
      }
      return null;
    };
    
    // Destroy all Phaser objects
    this.gameObject = safeDestroy(this.gameObject);
    this.hpBar = safeDestroy(this.hpBar);
    this.hpBarBg = safeDestroy(this.hpBarBg);
    this.hpText = safeDestroy(this.hpText);
    
    // Mark as destroyed
    this.reachedEnd = true;
    this.destroyed = true;
    this.hp = 0;
    
    // Clear references that might cause memory leaks
    this.path = null;
    this.position = null;
  }
}
