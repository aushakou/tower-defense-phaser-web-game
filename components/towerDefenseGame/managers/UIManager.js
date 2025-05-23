export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.upgradeButton = null;
    this.upgradeText = null;
  }

  createButtons() {
    // Start/Pause Button
    const pointX = this.scene.cameras.main.width - 80;
    const pointY = 200;

    const startButton = this.scene.add.text(pointX, pointY, 'Start', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => startButton.setStyle({ backgroundColor: '#ffffff', color: '#000000' }))
      .on('pointerout', () => startButton.setStyle({ 
        backgroundColor: this.scene.game.isGameRunning ? '#ffc400' : '#000000', 
        color: this.scene.game.isGameRunning ? '#000000' : '#ffffff' 
      }))
      .on('pointerdown', () => {
        if (!this.scene.game.isGameRunning) {
          // Start the game
          console.log('Starting game...');
          this.scene.game.startGame();
          this.scene.isGameRunning = true; // Update the scene's state as well
          startButton.setText('Pause');
          startButton.setStyle({ backgroundColor: '#ffc400', color: '#000000' });
        } else {
          // Pause the game
          console.log('Pausing game...');
          this.scene.game.pauseGame();
          this.scene.isGameRunning = false; // Update the scene's state as well
          startButton.setText('Start');
          startButton.setStyle({ backgroundColor: '#000000', color: '#ffffff' });
        }
      });

    this.startButton = startButton;
    
    // Grid ON/OFF Button (placed below Start button)
    const gridButtonY = pointY + 100; // Position it below the start button
    
    const gridButton = this.scene.add.text(pointX, gridButtonY, 'Grid: OFF', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 },
      align: 'center'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => gridButton.setStyle({ backgroundColor: '#666666' }))
      .on('pointerout', () => gridButton.setStyle({ 
        backgroundColor: this.scene.gridVisible ? '#008800' : '#444444'
      }))
      .on('pointerdown', () => {
        // Toggle grid visibility using MainScreen's method
        this.scene.toggleGrid();
        
        // Update button appearance
        if (this.scene.gridVisible) {
          this.updatePathVisualization();
          gridButton.setText('Grid: ON');
          gridButton.setStyle({ backgroundColor: '#008800', color: '#ffffff' });
        } else {
          this.clearPathVisualization();
          gridButton.setText('Grid: OFF');
          gridButton.setStyle({ backgroundColor: '#444444', color: '#ffffff' });
        }
      });
      
    this.gridButton = gridButton;
    
    return this;
  }
  
  createStatusBars() {
    // Stats bar
    this.scene.add.rectangle(
      this.scene.cameras.main.width - this.scene.SIDE_BAR_WIDTH, 
      0, 
      this.scene.SIDE_BAR_WIDTH, 
      this.scene.cameras.main.height, 
      0x000000
    ).setOrigin(0, 0).setAlpha(0.7);
    
    // Shop bar
    this.scene.add.rectangle(
      0, 
      0, 
      this.scene.SIDE_BAR_WIDTH, 
      this.scene.cameras.main.height, 
      0x000000
    ).setOrigin(0, 0).setAlpha(0.7);
    
    // Shop Label
    this.scene.add.text(20, 10, 'Gun Shop', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });
    
    // Create status texts
    // Health Text in Top-Right
    this.scene.healthText = this.scene.add.text(
      this.scene.cameras.main.width - 20, 
      20, 
      `Health: ${this.scene.game.health}`, 
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'left'
      }
    ).setOrigin(1, 0);

    // Money Text in Top-Right
    this.scene.moneyText = this.scene.add.text(
      this.scene.cameras.main.width - 20, 
      50, 
      `Money: $${this.scene.game.money}`, 
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'left'
      }
    ).setOrigin(1, 0);

    // Score Text in Top-Right
    this.scene.scoreText = this.scene.add.text(
      this.scene.cameras.main.width - 20, 
      80, 
      `Score: ${this.scene.game.score}`, 
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        align: 'left'
      }
    ).setOrigin(1, 0);
    
    return this;
  }
  
  createShopItems() {
    const cellSize = this.scene.getCellSize();

    // Cannon Icon in Shop
    const cannonIcon = this.scene.add.image(70, 120, 'cannon')
      .setOrigin(0.5)
      .setScale(0.25)
      .setRotation(Phaser.Math.DegToRad(180))
      .setInteractive({ draggable: true });

    // Cannon Price Text
    this.scene.add.text(100, 120, '$20', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    // MG Icon in Shop
    const mgIcon = this.scene.add.image(70, 240, 'mg')
      .setOrigin(0.5)
      .setScale(0.25)
      .setRotation(Phaser.Math.DegToRad(180))
      .setInteractive({ draggable: true });

    // MG Price Text
    this.scene.add.text(100, 240, '$40', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    
    // Setup drag events for cannon
    this.setupDragEvents(cannonIcon, 'cannon', this.scene.CANNON_COST, cellSize);
    
    // Setup drag events for MG
    this.setupDragEvents(mgIcon, 'mg', this.scene.MG_COST, cellSize);
    
    return this;
  }
  
  setupDragEvents(icon, type, cost, cellSize) {
    icon.on('dragstart', (pointer) => {
      // Store original grid state to restore it later
      this.wasGridVisible = this.scene.gridVisible;
      
      // Only show the grid if the toggle is already ON
      if (this.scene.gridGraphics && !this.scene.gridVisible) {
        // We'll temporarily enable grid only during dragging and restore it after
        this.scene.toggleGrid(true);
        this.temporaryGridVisibility = true;
      }
      
      this.scene.draggedItemType = type;
      this.scene.draggedItemCost = cost;
      this.scene.draggedItemImageKey = type;

      const scale = cellSize / 300;
      
      const preview = this.scene.add.image(pointer.x, pointer.y, this.scene.draggedItemImageKey)
        .setScale(scale)
        .setAlpha(0.7)
        .setDepth(25)
        .setRotation(Phaser.Math.DegToRad(180));
      
      this.scene.pendingCannon = preview;
      
      // Show temporary range visualization during drag
      let firingRange = type === 'cannon' ? 3 * cellSize : 2 * cellSize;
      this.scene.dragRangeCircle = this.scene.add.circle(
        preview.x,
        preview.y,
        firingRange,
        0x00ff00,
        0.2
      ).setDepth(12); // Same depth as tower range circles
      
      // Log to console for debugging
      console.log('Dragging started, grid should be visible');
    });

    icon.on('drag', (pointer) => {
      if (!this.scene.pendingCannon) return;
      
      const localX = pointer.x - this.scene.gridOffsetX;
      const localY = pointer.y - this.scene.gridOffsetY;
      
      const cellX = Math.floor(localX / cellSize);
      const cellY = Math.floor(localY / cellSize);
      
      const snappedX = this.scene.gridOffsetX + cellX * cellSize + cellSize / 2;
      const snappedY = this.scene.gridOffsetY + cellY * cellSize + cellSize / 2;
      
      this.scene.pendingCannon.setPosition(snappedX, snappedY);
      this.scene.pendingCell = { x: cellX, y: cellY };
      
      // Update range circle position
      if (this.scene.dragRangeCircle) {
        this.scene.dragRangeCircle.setPosition(snappedX, snappedY);
      }
    });
    
    icon.on('dragend', () => {
      // Restore original grid visibility state if we temporarily enabled it
      if (this.temporaryGridVisibility) {
        this.scene.toggleGrid(this.wasGridVisible);
        this.temporaryGridVisibility = false;
      }
      
      // Check if pendingCell exists before destructuring
      if (!this.scene.pendingCell) {
        this.scene.pendingCannon?.destroy();
        this.scene.pendingCannon = null;
        
        // Remove the temporary range circle
        if (this.scene.dragRangeCircle) {
          this.scene.dragRangeCircle.destroy();
          this.scene.dragRangeCircle = null;
        }
        
        return;
      }
      
      const { x: cellX, y: cellY } = this.scene.pendingCell;
      
      const isValid =
        cellX >= 0 && cellY >= 0 &&
        cellX < this.scene.GRID_COLS && cellY < this.scene.GRID_ROWS &&
        this.scene.grid[cellY][cellX] === null;
      
      if (isValid) {
        this.scene.showConfirmPopup(cellX, cellY);
      } else {
        this.scene.pendingCannon?.destroy();
        this.scene.pendingCannon = null;
      }
      
      // Remove the temporary range circle
      if (this.scene.dragRangeCircle) {
        this.scene.dragRangeCircle.destroy();
        this.scene.dragRangeCircle = null;
      }
      
      this.scene.pendingCell = { x: null, y: null };
    });
  }
  
  showUpgradeUI(tower) {
    // Clean up any existing UI first
    this.hideUpgradeUI();
    
    const cellSize = this.scene.getCellSize();
    const buttonScale = cellSize / 200; // Adjust based on your up.png size
    
    this.upgradeButton = this.scene.add.image(
      tower.gameObject.x,
      tower.gameObject.y - cellSize,
      'up'
    ).setScale(buttonScale).setInteractive().setDepth(25);
    
    this.upgradeText = this.scene.add.text(
      tower.gameObject.x,
      tower.gameObject.y - cellSize - 25,
      `Upgrade for $${tower.upgradeCost}`,
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5).setDepth(25);
    
    // Add click handler to the upgrade button
    this.upgradeButton.on('pointerdown', (event) => {
      event.stopPropagation(); // Prevent click from propagating to scene
      
      const success = tower.upgrade();
      if (success) {
        // Update upgrade button text
        this.upgradeText.setText(`Upgrade for $${tower.upgradeCost}`);
      } else {
        console.log("Not enough money to upgrade!");
        // Visual feedback for not enough money
        this.scene.tweens.add({
          targets: this.upgradeText,
          alpha: 0.3,
          yoyo: true,
          duration: 200,
          repeat: 1
        });
      }
    });
  }
  
  hideUpgradeUI() {
    if (this.upgradeButton) {
      this.upgradeButton.destroy();
      this.upgradeButton = null;
    }
    
    if (this.upgradeText) {
      this.upgradeText.destroy();
      this.upgradeText = null;
    }
  }
  
  showConfirmPopup(x, y, options) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    const popup = this.scene.add.rectangle(centerX, centerY, 200, 120, 0x000000, 0.8).setDepth(30);
    const text = this.scene.add.text(centerX, centerY - 30, options.message, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(31);
    
    const yesBtn = this.scene.add.text(centerX - 40, centerY + 20, 'Yes', {
      fontSize: '18px',
      backgroundColor: '#00aa00',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(32);
    
    const noBtn = this.scene.add.text(centerX + 40, centerY + 20, 'No', {
      fontSize: '18px',
      backgroundColor: '#aa0000',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(32);
    
    const destroyPopup = () => {
      popup.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    };
    
    yesBtn.on('pointerdown', () => {
      options.onYes();
      destroyPopup();
    });
    
    noBtn.on('pointerdown', () => {
      options.onNo();
      destroyPopup();
    });
    
    return { destroyPopup };
  }
  
  showGameOver() {
    // Show game over message
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    const gameOverText = this.scene.add.text(centerX, centerY - 50, 'GAME OVER', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ff0000',
      fontWeight: 'bold'
    }).setOrigin(0.5).setDepth(100);
    
    const scoreText = this.scene.add.text(centerX, centerY + 30, `Final Score: ${this.scene.game.score}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(100);
    
    // Add restart button
    const restartButton = this.scene.add.text(centerX, centerY + 100, 'RESTART', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().setDepth(100);
    
    restartButton.on('pointerover', () => restartButton.setStyle({ backgroundColor: '#333333' }));
    restartButton.on('pointerout', () => restartButton.setStyle({ backgroundColor: '#000000' }));
    restartButton.on('pointerdown', () => {
      // Reset the game state
      this.scene.game.reset();
      
      // Restart the scene
      this.scene.scene.restart();
    });
  }
  
  // Method to visualize the monster path when grid is enabled
  updatePathVisualization() {
    // Clear any existing path visualization
    this.clearPathVisualization();
    
    // Create a graphics object for the path
    this.pathGraphics = this.scene.add.graphics();
    this.pathGraphics.setDepth(11);
    
    // Get standard start and end points for main path
    const startCol = Math.floor(this.scene.GRID_COLS / 2);
    const startRow = this.scene.GRID_ROWS - 1;
    const endCol = Math.floor(this.scene.GRID_COLS / 2);
    const endRow = 0;
    
    // Get the main path from start to end
    const mainPath = this.scene.pathManager.findPath(
      { row: startRow, col: startCol },
      { row: endRow, col: endCol }
    );
    
    // Draw the main path
    this.drawPath(mainPath, 0xff0000, 0.8); // Red line for the main path
    
    // Get all active monsters' paths
    if (this.scene.monsterManager && this.scene.monsterManager.monsters) {
      const monsters = this.scene.monsterManager.monsters;
      
      // For each active monster, draw its current path if different from main path
      monsters.forEach((monster, index) => {
        if (monster && monster.path && !monster.reachedEnd) {
          // Only draw unique paths different from the main path
          if (!this.isSamePath(monster.path, mainPath)) {
            // Use different colors for different monsters
            const color = this.getPathColor(index);
            this.drawPath(monster.path, color, 0.6);
          }
        }
      });
    }
  }
  
  // Helper method to draw a path with specified color and alpha
  drawPath(path, color = 0xff0000, alpha = 0.8) {
    if (!path || path.length === 0) return;
    
    const pathGraphics = this.pathGraphics;
    
    // Calculate cell size
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    const cellSize = adjustedWidth <= adjustedHeight ? 
      adjustedWidth / this.scene.GRID_COLS : 
      adjustedHeight / this.scene.GRID_ROWS;
    
    // Draw the path
    pathGraphics.lineStyle(3, color, alpha);
    
    // Start drawing path
    const startX = this.scene.gridOffsetX + path[0].col * cellSize + cellSize / 2;
    const startY = this.scene.gridOffsetY + path[0].row * cellSize + cellSize / 2;
    
    pathGraphics.moveTo(startX, startY);
    
    // Draw lines connecting each point in the path
    for (let i = 1; i < path.length; i++) {
      const x = this.scene.gridOffsetX + path[i].col * cellSize + cellSize / 2;
      const y = this.scene.gridOffsetY + path[i].row * cellSize + cellSize / 2;
      pathGraphics.lineTo(x, y);
    }
    
    pathGraphics.strokePath();
    
    // Add path markers at each step
    pathGraphics.fillStyle(color, alpha);
    for (let i = 0; i < path.length; i++) {
      const x = this.scene.gridOffsetX + path[i].col * cellSize + cellSize / 2;
      const y = this.scene.gridOffsetY + path[i].row * cellSize + cellSize / 2;
      pathGraphics.fillCircle(x, y, 5);
    }
  }
  
  // Helper method to check if two paths are the same
  isSamePath(path1, path2) {
    if (!path1 || !path2 || path1.length !== path2.length) return false;
    
    for (let i = 0; i < path1.length; i++) {
      if (path1[i].row !== path2[i].row || path1[i].col !== path2[i].col) {
        return false;
      }
    }
    
    return true;
  }
  
  // Get different colors for different monster paths
  getPathColor(index) {
    const colors = [
      0xff0000, // Red
      0x00ff00, // Green
      0x0000ff, // Blue
      0xffff00, // Yellow
      0xff00ff, // Magenta
      0x00ffff, // Cyan
      0xff8800, // Orange
      0x8800ff  // Purple
    ];
    
    return colors[index % colors.length];
  }
  
  // Clear path visualization
  clearPathVisualization() {
    if (this.pathGraphics) {
      this.pathGraphics.clear();
      this.pathGraphics.destroy();
      this.pathGraphics = null;
    }
  }
} 