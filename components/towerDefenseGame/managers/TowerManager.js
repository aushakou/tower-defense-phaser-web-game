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
      }
    };
    
    // Set alpha to 1 (full opacity)
    towerData.gameObject.setAlpha(1);
    
    // Create range circle (initially hidden)
    const rangeCircle = this.scene.add.circle(
      x,
      y,
      towerData.range,
      0x00ff00,
      0.2
    ).setDepth(1).setVisible(false);
    
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
    
    // Recalculate paths if necessary
    if (this.scene.pathManager) {
      this.scene.pathManager.recalculatePaths();
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
        if (this.scene.game.spendMoney(this.scene.draggedItemCost)) {
          // Place tower
          this.placeTower(
            cellX, 
            cellY, 
            this.scene.draggedItemType, 
            this.scene.draggedItemCost, 
            this.scene.draggedItemImageKey
          );
        } else {
          // Not enough money
          this.scene.pendingCannon?.destroy();
          this.scene.pendingCannon = null;
        }
      },
      onNo: () => {
        // User declined
        this.scene.pendingCannon?.destroy();
        this.scene.pendingCannon = null;
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
} 