export default class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.upgradeButton = null;
    this.upgradeText = null;
    
    // Path animation properties
    this.pathAnimations = [];
    this.animatedDots = [];
    this.pathAnimationTimer = null;
    this.lastLogTime = 0;
    
    // Bind updatePathAnimations to this instance to prevent context issues
    this.updatePathAnimations = this.updatePathAnimations.bind(this);
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
      .setDepth(25)
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
    
    // Restart Button (below Start button)
    const restartButtonY = pointY + 60; // Position it below the start button
    
    const restartButton = this.scene.add.text(pointX, restartButtonY, 'Restart', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#880000',
      padding: { x: 20, y: 10 },
      align: 'center'
    })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartButton.setStyle({ backgroundColor: '#aa0000' }))
      .on('pointerout', () => restartButton.setStyle({ backgroundColor: '#880000' }))
      .on('pointerdown', () => {
        // Reset the game
        console.log('Restarting game...');
        this.scene.game.reset();
        this.scene.scene.restart();
      });
    
    this.restartButton = restartButton;
    
    // Grid ON/OFF Button
    const gridButtonY = restartButtonY + 60; // Position it below the restart button
    
    const gridButton = this.scene.add.text(pointX, gridButtonY, 'Grid: OFF', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 },
      align: 'center'
    })
      .setOrigin(0.5)
      .setDepth(25)
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
    
    // Path ON/OFF Button
    const pathButtonY = gridButtonY + 60; // Position it below the grid button
    
    const pathButton = this.scene.add.text(pointX, pathButtonY, 'Path: OFF', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 },
      align: 'center'
    })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => pathButton.setStyle({ backgroundColor: '#666666' }))
      .on('pointerout', () => pathButton.setStyle({ 
        backgroundColor: this.pathVisible ? '#880088' : '#444444'
      }))
      .on('pointerdown', () => {
        // Toggle path visibility
        this.pathVisible = !this.pathVisible;
        
        // Update path visualization
        if (this.pathVisible) {
          // No longer forcing grid visibility - we just update path
          this.updatePathVisualization();
          pathButton.setText('Path: ON');
          pathButton.setStyle({ backgroundColor: '#880088', color: '#ffffff' });
        } else {
          this.clearPathVisualization();
          pathButton.setText('Path: OFF');
          pathButton.setStyle({ backgroundColor: '#444444', color: '#ffffff' });
        }
      });
      
    this.pathButton = pathButton;
    this.pathVisible = false;
    
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
    ).setOrigin(0, 0).setAlpha(0.7).setDepth(20);
    
    // Shop bar
    this.scene.add.rectangle(
      0, 
      0, 
      this.scene.SIDE_BAR_WIDTH, 
      this.scene.cameras.main.height, 
      0x000000
    ).setOrigin(0, 0).setAlpha(0.7).setDepth(20);
    
    // Shop Label
    this.scene.add.text(20, 10, 'Gun Shop', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setDepth(25);
    
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
    ).setOrigin(1, 0).setDepth(25);

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
    ).setOrigin(1, 0).setDepth(25);

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
    ).setOrigin(1, 0).setDepth(25);
    
    return this;
  }
  
  createShopItems() {
    const cellSize = this.scene.getCellSize();

    // Cannon Icon in Shop
    const cannonIcon = this.scene.add.image(70, 120, 'cannon')
      .setOrigin(0.5)
      .setScale(0.25)
      .setDepth(25)
      .setRotation(Phaser.Math.DegToRad(180))
      .setInteractive({ draggable: true });

    // Cannon Price Text
    this.scene.add.text(100, 120, '$20', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setDepth(25);

    // MG Icon in Shop
    const mgIcon = this.scene.add.image(70, 240, 'mg')
      .setOrigin(0.5)
      .setScale(0.25)
      .setDepth(25)
      .setRotation(Phaser.Math.DegToRad(180))
      .setInteractive({ draggable: true });

    // MG Price Text
    this.scene.add.text(100, 240, '$40', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setDepth(25);
    
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
      
      // Create highlight cell rectangle for placement preview
      this.cellHighlight = this.scene.add.rectangle(0, 0, cellSize, cellSize, 0x00ff00, 0.3)
        .setDepth(11)
        .setVisible(false);
      
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
      
      // Update cell highlight position and color
      if (this.cellHighlight) {
        const cellCenterX = this.scene.gridOffsetX + cellX * cellSize + cellSize/2;
        const cellCenterY = this.scene.gridOffsetY + cellY * cellSize + cellSize/2;
        this.cellHighlight.setPosition(cellCenterX, cellCenterY);
        this.cellHighlight.setSize(cellSize, cellSize);
        
        // Basic placement check (cell is within grid and is empty)
        const basicValid = 
          cellX >= 0 && cellY >= 0 &&
          cellX < this.scene.GRID_COLS && cellY < this.scene.GRID_ROWS &&
          this.scene.grid[cellY][cellX] === null;
        
        if (basicValid) {
          // Path check - simulate placing a tower here and see if there's still a valid path
          const tempTowerPlaced = this.checkIfPlacementBlocksPath(cellX, cellY);
          
          if (!tempTowerPlaced) {
            // Valid placement - Green
            this.cellHighlight.setFillStyle(0x00ff00, 0.3);
          } else {
            // Invalid placement (blocks path) - Red
            this.cellHighlight.setFillStyle(0xff0000, 0.3);
          }
          this.cellHighlight.setVisible(true);
        } else {
          // Invalid placement (out of bounds or occupied cell) - Red
          this.cellHighlight.setFillStyle(0xff0000, 0.3);
          this.cellHighlight.setVisible(true);
        }
      }
    });
    
    icon.on('dragend', () => {
      // Restore original grid visibility state if we temporarily enabled it
      if (this.temporaryGridVisibility) {
        this.scene.toggleGrid(this.wasGridVisible);
        this.temporaryGridVisibility = false;
      }
      
      // Remove cell highlight
      if (this.cellHighlight) {
        this.cellHighlight.destroy();
        this.cellHighlight = null;
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
        this.scene.grid[cellY][cellX] === null &&
        !this.checkIfPlacementBlocksPath(cellX, cellY);
      
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
  
  // Check if placing a tower at (cellX, cellY) would block all valid paths
  checkIfPlacementBlocksPath(cellX, cellY) {
    // Calculate start and end points (monster spawn and exit points)
    const startRow = this.scene.GRID_ROWS - 1;
    const startCol = Math.floor(this.scene.GRID_COLS / 2);
    const endRow = 0;
    const endCol = Math.floor(this.scene.GRID_COLS / 2);
    
    // First, explicitly prevent placement on the start or end points
    if ((cellY === startRow && cellX === startCol) || 
        (cellY === endRow && cellX === endCol)) {
      return true; // Always block placement on spawn or exit points
    }
    
    // Create a temporary grid representation where true means blocked
    const tempGrid = Array(this.scene.GRID_ROWS).fill().map(() => Array(this.scene.GRID_COLS).fill(false));
    
    // Copy blocked cells from the real grid
    for (let row = 0; row < this.scene.GRID_ROWS; row++) {
      for (let col = 0; col < this.scene.GRID_COLS; col++) {
        // Mark cell as blocked if it has a tower in it
        if (this.scene.grid[row][col] !== null) {
          tempGrid[row][col] = true;
        }
      }
    }
    
    // Temporarily mark this cell as occupied in our temp grid
    tempGrid[cellY][cellX] = true;
    
    // Simple breadth-first search to check if path exists
    const visited = Array(this.scene.GRID_ROWS).fill().map(() => Array(this.scene.GRID_COLS).fill(false));
    const queue = [{row: startRow, col: startCol}];
    visited[startRow][startCol] = true;
    
    while (queue.length > 0) {
      const {row, col} = queue.shift();
      
      // If we reached the end, a path exists
      if (row === endRow && col === endCol) {
        return false; // Path exists, placement doesn't block
      }
      
      // Try all four directions
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        // Check if valid and not visited
        if (
          newRow >= 0 && newRow < this.scene.GRID_ROWS &&
          newCol >= 0 && newCol < this.scene.GRID_COLS &&
          !tempGrid[newRow][newCol] && // Not blocked
          !visited[newRow][newCol] // Not visited
        ) {
          visited[newRow][newCol] = true;
          queue.push({row: newRow, col: newCol});
        }
      }
    }
    
    // If we get here, no path exists
    return true; // Placement blocks all paths
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
    
    const popup = this.scene.add.rectangle(centerX, centerY, 200, 120, 0x000000, 0.8).setDepth(80);
    const text = this.scene.add.text(centerX, centerY - 30, options.message, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(81);
    
    const yesBtn = this.scene.add.text(centerX - 40, centerY + 20, 'Yes', {
      fontSize: '18px',
      backgroundColor: '#00aa00',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(82);
    
    const noBtn = this.scene.add.text(centerX + 40, centerY + 20, 'No', {
      fontSize: '18px',
      backgroundColor: '#aa0000',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(82);
    
    const destroyPopup = () => {
      popup.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    };
    
    yesBtn.on('pointerdown', () => {
      if (this.scene.game.money >= this.scene.draggedItemCost) {
        options.onYes();
        destroyPopup();
      } else {
        // Not enough money - make sure to cleanup the cannon
        destroyPopup();
        if (this.scene.pendingCannon) {
          this.scene.pendingCannon.destroy();
          this.scene.pendingCannon = null;
        }
        
        // Remove range circle if it exists
        if (this.scene.dragRangeCircle) {
          this.scene.dragRangeCircle.destroy();
          this.scene.dragRangeCircle = null;
        }
        
        this.showNotEnoughMoneyPopup();
      }
    });
    
    noBtn.on('pointerdown', () => {
      options.onNo();
      destroyPopup();
    });
    
    return { destroyPopup };
  }
  
  // Show a "Not Enough Money" popup for 3 seconds
  showNotEnoughMoneyPopup() {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    const popup = this.scene.add.rectangle(centerX, centerY, 300, 80, 0x880000, 0.9).setDepth(40);
    const text = this.scene.add.text(centerX, centerY, "Not Enough Money!", {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(41);
    
    // Make the popup fade in and out
    this.scene.tweens.add({
      targets: [popup, text],
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // After fade in, wait then fade out
        this.scene.tweens.add({
          targets: [popup, text],
          alpha: { from: 1, to: 0 },
          duration: 300,
          ease: 'Power2',
          delay: 2400, // Wait for 2.4 seconds before fading out (total 3 seconds with fade in/out)
          onComplete: () => {
            popup.destroy();
            text.destroy();
          }
        });
      }
    });
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
    
    // Only proceed if the path visibility is enabled
    if (!this.pathVisible) return;
    
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
    
    // Draw glow effect (slightly wider line with lower alpha)
    pathGraphics.lineStyle(6, color, alpha * 0.3);
    
    // Start drawing path glow
    const startX = this.scene.gridOffsetX + path[0].col * cellSize + cellSize / 2;
    const startY = this.scene.gridOffsetY + path[0].row * cellSize + cellSize / 2;
    
    pathGraphics.moveTo(startX, startY);
    
    // Draw lines connecting each point in the path for glow
    for (let i = 1; i < path.length; i++) {
      const x = this.scene.gridOffsetX + path[i].col * cellSize + cellSize / 2;
      const y = this.scene.gridOffsetY + path[i].row * cellSize + cellSize / 2;
      pathGraphics.lineTo(x, y);
    }
    
    pathGraphics.strokePath();
    
    // Draw the main path with a thinner, more vibrant line
    pathGraphics.lineStyle(2, color, alpha);
    
    // Start drawing main path
    pathGraphics.moveTo(startX, startY);
    
    // Store line segments for animation
    const lineSegments = [];
    let totalLength = 0;
    
    // First point
    let lastX = startX;
    let lastY = startY;
    
    // Draw lines connecting each point in the path
    for (let i = 1; i < path.length; i++) {
      const x = this.scene.gridOffsetX + path[i].col * cellSize + cellSize / 2;
      const y = this.scene.gridOffsetY + path[i].row * cellSize + cellSize / 2;
      
      // Draw the line
      pathGraphics.lineTo(x, y);
      
      // Calculate segment length
      const dx = x - lastX;
      const dy = y - lastY;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // Store segment
      lineSegments.push({
        x1: lastX,
        y1: lastY,
        x2: x,
        y2: y,
        length: length
      });
      
      totalLength += length;
      
      // Update last point
      lastX = x;
      lastY = y;
    }
    
    pathGraphics.strokePath();
    
    // Create animated dots for this path
    this.createAnimatedPathDots(lineSegments, totalLength, color, alpha);
  }
  
  // Create animated dots that flow along the path
  createAnimatedPathDots(segments, totalLength, color, alpha) {
    if (!segments || segments.length === 0) return;
    
    console.log('Creating animated path dots:', 
      'Segments:', segments.length, 
      'TotalLength:', totalLength,
      'Color:', color.toString(16));
    
    // Stop any existing animation timer
    if (this.pathAnimationTimer) {
      this.pathAnimationTimer.remove();
      this.pathAnimationTimer = null;
    }
    
    // Number of dots to create based on path length
    const numDots = Math.min(Math.ceil(totalLength / 50), 15); // Fewer dots for cleaner appearance
    console.log('Creating', numDots, 'animated dots');
    
    // Create animation data
    const pathAnimation = {
      segments: segments,
      totalLength: totalLength,
      color: color,
      alpha: alpha,
      dots: []
    };
    
    // Create dots with initial positions
    for (let i = 0; i < numDots; i++) {
      // Distribute dots evenly along the path
      const offset = (i / numDots) * totalLength;
      
      // Create a dot sprite instead of a circle
      let dot;
      
      // Check if we have the path_dot image loaded
      if (this.scene.textures.exists('path_dot')) {
        console.log('Using path_dot sprite texture');
        // Use the sprite with the loaded texture
        const dotSize = 0.3 + Math.random() * 0.1; // Increase scale for better visibility
        dot = this.scene.add.sprite(0, 0, 'path_dot')
          .setScale(dotSize)
          .setDepth(12)
          .setTint(color)
          .setAlpha(alpha);
      } else {
        console.log('Fallback to circle - path_dot texture not found');
        // Fallback to circle if image is not available
        const dotSize = 6 + Math.random() * 3; // Larger circles for better visibility
        dot = this.scene.add.circle(0, 0, dotSize, color, alpha)
          .setDepth(12);
      }
      
      // Add to array with custom properties
      pathAnimation.dots.push({
        gameObject: dot,
        offset: offset,
        baseSize: dot.type === 'Sprite' ? dot.scaleX : dot.radius,
        pulsePhase: Math.random() * Math.PI * 2, // Random starting phase
        isSprite: dot.type === 'Sprite'
      });
    }
    
    // Add to animations array
    this.pathAnimations.push(pathAnimation);
    console.log('Path animation added, total animations:', this.pathAnimations.length);
    
    // Start animation timer if not already running
    if (!this.pathAnimationTimer) {
      console.log('Starting animation timer');
      this.pathAnimationTimer = this.scene.time.addEvent({
        delay: 30, // Update every 30ms for smoother animation
        callback: this.updatePathAnimations,
        callbackScope: this,
        loop: true
      });
    }
  }
  
  // Update all path animations
  updatePathAnimations() {
    if (!this.scene || !this.scene.time) {
      console.error('Scene reference lost in updatePathAnimations');
      return;
    }
    
    // Animation speed (pixels per update)
    const speed = 3;
    const time = this.scene.time.now / 1000; // Current time in seconds
    
    // Debug: Log animation stats occasionally
    if (Math.floor(time) % 5 === 0 && Math.floor(time) !== this.lastLogTime) {
      this.lastLogTime = Math.floor(time);
      console.log('Animation update at time:', time, 
        'Animations:', this.pathAnimations.length,
        'Dots:', this.pathAnimations.reduce((sum, anim) => sum + anim.dots.length, 0));
    }
    
    // Update each path animation
    for (const animation of this.pathAnimations) {
      // Update each dot in this animation
      for (const dot of animation.dots) {
        // Move dot along path
        dot.offset = (dot.offset + speed) % animation.totalLength;
        
        // Calculate position along path
        let distanceTravelled = 0;
        
        // Find the segment this dot is on
        for (const segment of animation.segments) {
          if (distanceTravelled + segment.length >= dot.offset) {
            // This is the segment
            const segmentOffset = dot.offset - distanceTravelled;
            const ratio = segmentOffset / segment.length;
            
            // Linear interpolation to find position
            const x = segment.x1 + ratio * (segment.x2 - segment.x1);
            const y = segment.y1 + ratio * (segment.y2 - segment.y1);
            
            // Update dot position
            dot.gameObject.setPosition(x, y);
            
            // Handle pulsating based on dot type
            if (dot.isSprite) {
              // For sprites, pulsate scale
              const pulseFactor = 0.3 * Math.sin(time * 5 + dot.pulsePhase) + 1;
              dot.gameObject.setScale(dot.baseSize * pulseFactor);
              
              // Also rotate the sprite for additional effect
              dot.gameObject.rotation += 0.05;
              
              // Pulse alpha
              const alphaFactor = 0.2 * Math.sin(time * 3 + dot.pulsePhase) + 0.8;
              dot.gameObject.setAlpha(animation.alpha * alphaFactor);
            } else {
              // For circles, pulsate radius
              const pulseFactor = 0.3 * Math.sin(time * 5 + dot.pulsePhase) + 1;
              dot.gameObject.setRadius(dot.baseSize * pulseFactor);
              
              // Pulse alpha
              const alphaFactor = 0.2 * Math.sin(time * 3 + dot.pulsePhase) + 0.8;
              dot.gameObject.setAlpha(animation.alpha * alphaFactor);
            }
            
            break;
          }
          
          distanceTravelled += segment.length;
        }
      }
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
  
  // Clear path visualization (override)
  clearPathVisualization() {
    // Clear graphics
    if (this.pathGraphics) {
      this.pathGraphics.clear();
      this.pathGraphics.destroy();
      this.pathGraphics = null;
    }
    
    // Stop animation timer
    if (this.pathAnimationTimer) {
      this.pathAnimationTimer.remove();
      this.pathAnimationTimer = null;
    }
    
    // Destroy all animated dots
    for (const animation of this.pathAnimations) {
      for (const dot of animation.dots) {
        dot.gameObject.destroy();
      }
    }
    
    // Clear animations array
    this.pathAnimations = [];
  }
} 