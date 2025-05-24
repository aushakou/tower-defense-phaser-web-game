import Tower, { Cannon, MG, MissileLauncher } from '../entities/Tower.js';

export default class TowerManager {
  constructor(scene) {
    this.scene = scene;
    this.selectedTower = null;
  }
  
  selectTower(tower) {
    // Hide range of previously selected tower
    if (this.selectedTower) {
      this.selectedTower.hideRange();
    }
    
    // Set new selected tower
    this.selectedTower = tower;
    
    // Show range of new selected tower
    if (this.selectedTower) {
      this.selectedTower.showRange();
      
      // Show upgrade UI
      if (this.scene.ui) {
        this.scene.ui.showUpgradeUI(tower);
      }
    }
  }
  
  deselectTower() {
    if (this.selectedTower) {
      this.selectedTower.hideRange();
      this.selectedTower = null;
      
      // Hide upgrade UI
      if (this.scene.ui) {
        this.scene.ui.hideUpgradeUI();
      }
    }
  }
  
  placeTower(row, col, towerType) {
    // Use the constant cell size
    const cellSize = this.scene.CELL_SIZE;
    
    // Calculate position for tower
    const x = this.scene.gridOffsetX + col * cellSize + cellSize / 2;
    const y = this.scene.gridOffsetY + row * cellSize + cellSize / 2;
    
    // Double check the cell is empty
    if (this.scene.grid[row][col] !== null) {
      console.error('Attempted to place tower on an occupied cell!');
      return null;
    }
    
    let towerData;
    const scale = cellSize / 300; // Scale tower based on cell size
    
    // Create the appropriate tower type
    switch (towerType) {
      case 'cannon':
        towerData = new Cannon(this.scene, {
          row, col, x, y,
          imageKey: 'cannon',
          scale: scale,
          type: 'cannon'
        });
        break;
        
      case 'mg':
        towerData = new MG(this.scene, {
          row, col, x, y,
          imageKey: 'mg',
          scale: scale,
          type: 'mg'
        });
        break;
        
      case 'missileLauncher':
        towerData = new MissileLauncher(this.scene, {
          row, col, x, y,
          imageKey: 'missileLauncher',
          scale: scale,
          type: 'missileLauncher'
        });
        break;
        
      default:
        console.error('Unknown tower type:', towerType);
        return null;
    }
    
    // Place tower in grid
    this.scene.grid[row][col] = towerData;
    
    // Apply game speed to fire rate
    if (this.scene.ui && this.scene.ui.gameSpeed > 1) {
      towerData.fireRate = towerData.fireRate / this.scene.ui.gameSpeed;
    }
    
    // Deduct money
    this.scene.game.spendMoney(towerData.buyCost);
    
    // Reset pending tower
    this.scene.pendingCannon = null;
    
    // Recalculate paths
    if (this.scene.pathManager) {
      this.scene.pathManager.recalculatePaths();
      
      // Update the path visualization if path is visible
      if (this.scene.ui && this.scene.ui.pathVisible) {
        this.scene.ui.updatePathVisualization();
      }
      
      // Update existing monsters' paths without visualizing them
      this.updateMonsterPaths();
    }
    
    return towerData;
  }
  
  // Update paths for all existing monsters after tower placement
  updateMonsterPaths() {
    if (!this.scene.monsterManager) return;
    
    for (const monster of this.scene.monsterManager.monsters) {
      if (!monster || monster.reachedEnd) continue;
      
      // Get current position
      const currentPos = monster.position;
      if (!currentPos) continue;
      
      // Get end point (top middle)
      const endCol = Math.floor(this.scene.GRID_COLS / 2);
      const endRow = 0;
      
      // Calculate new path from current position
      const newPath = this.scene.pathManager.findPath(
        currentPos,
        { row: endRow, col: endCol }
      );
      
      // Update monster's path if valid path was found
      if (newPath && newPath.length > 0) {
        monster.path = newPath;
        monster.currentPathIndex = 0;
      }
    }
  }
  
  showConfirmPopup(cellX, cellY) {
    // First check if this cell is already occupied or invalid
    if (cellX < 0 || cellY < 0 || 
        cellX >= this.scene.GRID_COLS || 
        cellY >= this.scene.GRID_ROWS ||
        this.scene.grid[cellY][cellX] !== null) {
      return;
    }
    
    // Check if we can afford it
    if (this.scene.game.money < this.scene.draggedItemCost) {
      // Clean up preview image
      if (this.scene.pendingCannon) {
        this.scene.pendingCannon.destroy();
        this.scene.pendingCannon = null;
      }
      
      // Remove range circle if it exists
      if (this.scene.dragRangeCircle) {
        this.scene.dragRangeCircle.destroy();
        this.scene.dragRangeCircle = null;
      }
      
      this.scene.ui.showNotEnoughMoneyPopup();
      return;
    }
    
    this.scene.ui.showConfirmPopup(cellX, cellY, {
      message: `Buy ${this.scene.draggedItemType} for $${this.scene.draggedItemCost}?`,
      onYes: () => {
        const tower = this.placeTower(cellY, cellX, this.scene.draggedItemType);
        
        // Clean up the draggedItemType and draggedItemCost
        this.scene.draggedItemType = null;
        this.scene.draggedItemCost = 0;
        
        // Clean up preview image
        if (this.scene.pendingCannon) {
          this.scene.pendingCannon.destroy();
          this.scene.pendingCannon = null;
        }
        
        // Remove range circle if it exists
        if (this.scene.dragRangeCircle) {
          this.scene.dragRangeCircle.destroy();
          this.scene.dragRangeCircle = null;
        }
      },
      onNo: () => {
        console.log('Cancelled tower placement');
        
        // Clean up preview image
        if (this.scene.pendingCannon) {
          this.scene.pendingCannon.destroy();
          this.scene.pendingCannon = null;
        }
        
        // Remove range circle if it exists
        if (this.scene.dragRangeCircle) {
          this.scene.dragRangeCircle.destroy();
          this.scene.dragRangeCircle = null;
        }
      }
    });
  }
}
