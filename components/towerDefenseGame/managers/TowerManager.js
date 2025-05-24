export default class TowerManager {
  constructor(scene) {
    this.scene = scene;
    this.selectedTower = null;
  }
  
  selectTower(tower) {
    // First, deselect any previously selected tower
    this.deselectTower();
    
    // Select this tower
    this.selectedTower = tower;
    
    // Show range visualization
    tower.showRange();
    
    // Show upgrade UI
    this.scene.ui.showUpgradeUI(tower);
  }
  
  deselectTower() {
    // Hide range visualization and upgrade UI
    if (this.selectedTower) {
      this.selectedTower.hideRange();
      this.selectedTower = null;
    }
    
    // Hide upgrade UI
    this.scene.ui.hideUpgradeUI();
  }
  
  placeTower(cellX, cellY, type, cost, imageKey) {
    // Final safety check - don't place if a monster is in this cell
    if (this.scene.ui.checkIfCellHasMonster(cellX, cellY)) {
      console.log("CRITICAL SAFETY: Prevented tower placement on monster in placeTower");
      
      // Cleanup
      if (this.scene.pendingCannon) {
        this.scene.pendingCannon.destroy();
        this.scene.pendingCannon = null;
      }
      
      return null;
    }
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / this.scene.GRID_COLS : adjustedHeight / this.scene.GRID_ROWS;
    
    // Calculate tower position
    const x = this.scene.gridOffsetX + cellX * cellSize + cellSize / 2;
    const y = this.scene.gridOffsetY + cellY * cellSize + cellSize / 2;
    
    // Calculate tower scale
    const scale = cellSize / 300;
    
    // Create tower
    const towerData = {
      gameObject: this.scene.pendingCannon,
      type: type,
      cost: cost,
      position: { row: cellY, col: cellX },
      range: type === 'cannon' ? 3 * cellSize : 2 * cellSize,
      lastFired: 0,
      fireRate: 3000, // fire every 3 seconds (in ms)
      damage: 20,
      bullets: [],
      level: 1,
      upgradeCost: 50,
      sellCost: 10,
      scene: this.scene, // Store reference to scene
      
      // Add methods to show/hide range
      showRange: function() {
        if (this.rangeCircle) {
          this.rangeCircle.setVisible(true);
        }
      },
      
      hideRange: function() {
        if (this.rangeCircle) {
          this.rangeCircle.setVisible(false);
        }
      },
      
      // Add upgrade method with proper scene reference
      upgrade: function() {
        return this.scene.towerManager.upgradeTower(this);
      }
    };
    
    // Set alpha to 1 (full opacity)
    towerData.gameObject.setAlpha(1).setDepth(35);
    
    // Create range circle (initially hidden)
    const rangeCircle = this.scene.add.circle(
      x,
      y,
      towerData.range,
      0x00ff00,
      0.2
    ).setDepth(12).setVisible(false);
    
    towerData.rangeCircle = rangeCircle;
    
    // Make tower interactive
    towerData.gameObject.setInteractive();
    
    // Add click handler
    towerData.gameObject.on('pointerdown', () => {
      this.selectTower(towerData);
    });
    
    // Add tower to grid
    this.scene.grid[cellY][cellX] = towerData;
    
    // Reset pending tower
    this.scene.pendingCannon = null;
    
    // Recalculate paths
    if (this.scene.pathManager) {
      this.scene.pathManager.recalculatePaths();
      
      // Update the path visualization if grid is visible
      if (this.scene.gridVisible && this.scene.ui) {
        // Clear existing path visualization first to ensure a clean redraw
        this.scene.ui.clearPathVisualization(); 
        this.scene.ui.updatePathVisualization();
      }
      
      // Update existing monsters' paths
      this.updateMonsterPaths();
    }
    
    return towerData;
  }
  
  checkTowerPlacement(cellX, cellY) {
    return (
      cellX >= 0 && cellY >= 0 &&
      cellX < this.scene.GRID_COLS && cellY < this.scene.GRID_ROWS &&
      this.scene.grid[cellY][cellX] === null
    );
  }
  
  showConfirmPopup(cellX, cellY) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    this.scene.ui.showConfirmPopup(cellX, cellY, {
      message: `Buy? $${this.scene.draggedItemCost}`,
      onYes: () => {
        // Double check for monsters at this location in TowerManager too
        if (this.scene.ui.checkIfCellHasMonster(cellX, cellY)) {
          console.log("TowerManager prevented tower placement on monster");
          
          // Cleanup
          this.scene.pendingCannon?.destroy();
          this.scene.pendingCannon = null;
          
          if (this.scene.dragRangeCircle) {
            this.scene.dragRangeCircle.destroy();
            this.scene.dragRangeCircle = null;
          }
          
          // Show warning
          this.scene.ui.showWarningPopup("Cannot place tower on a monster!");
          return;
        }
        
        if (this.scene.game.spendMoney(this.scene.draggedItemCost)) {
          // Place tower
          this.placeTower(
            cellX, 
            cellY, 
            this.scene.draggedItemType, 
            this.scene.draggedItemCost, 
            this.scene.draggedItemImageKey
          );
          
          // Clean up the temporary drag range circle
          if (this.scene.dragRangeCircle) {
            this.scene.dragRangeCircle.destroy();
            this.scene.dragRangeCircle = null;
          }
        } else {
          // Not enough money
          this.scene.pendingCannon?.destroy();
          this.scene.pendingCannon = null;
          
          // Also clean up the range circle if money is insufficient
          if (this.scene.dragRangeCircle) {
            this.scene.dragRangeCircle.destroy();
            this.scene.dragRangeCircle = null;
          }
        }
      },
      onNo: () => {
        // User declined
        this.scene.pendingCannon?.destroy();
        this.scene.pendingCannon = null;
        
        // Also clean up the range circle on decline
        if (this.scene.dragRangeCircle) {
          this.scene.dragRangeCircle.destroy();
          this.scene.dragRangeCircle = null;
        }
      }
    });
  }
  
  upgradeTower(tower) {
    if (this.scene.game.spendMoney(tower.upgradeCost)) {
      // Upgrade stats
      tower.level++;
      tower.damage += 10; // Increase damage by 10 per level
      tower.fireRate *= 0.8; // Reduce fire rate by 20% (fire faster)
      tower.range *= 1.2; // Increase range by 20%
      tower.upgradeCost = Math.floor(tower.upgradeCost * 1.5); // Increase upgrade cost
      
      // Update range circle
      tower.rangeCircle.setRadius(tower.range);
      
      return true;
    }
    
    return false;
  }
  
  // Method to update paths for all existing monsters
  updateMonsterPaths() {
    if (!this.scene.monsterManager || !this.scene.monsterManager.monsters) return;
    
    const monsters = this.scene.monsterManager.monsters;
    
    monsters.forEach(monster => {
      if (monster && !monster.reachedEnd) {
        // Get the current position of the monster
        const currentPosition = monster.position;
        
        // Get the end goal (typically top middle)
        const endCol = Math.floor(this.scene.GRID_COLS / 2);
        const endRow = 0;
        
        // Calculate a new path from current position to goal
        const newPath = this.scene.pathManager.findPath(
          currentPosition,
          { row: endRow, col: endCol }
        );
        
        // If a valid path was found, update the monster's path
        if (newPath && newPath.length > 0) {
          monster.path = newPath;
          monster.currentPathIndex = 0;
        }
      }
    });
  }
} 