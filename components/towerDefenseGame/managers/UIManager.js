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
    
    // Game speed tracking
    this.gameSpeed = 1;
    
    // Grid properties
    this.gridGraphics = null;
    this.gridCoordinateTexts = [];
    this.gridVisible = false;
    
    // Bind updatePathAnimations to this instance to prevent context issues
    this.updatePathAnimations = this.updatePathAnimations.bind(this);
  }

  // Add walls and castle decorations around the game grid
  addDecorations() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / this.scene.GRID_COLS : adjustedHeight / this.scene.GRID_ROWS;
    
    const gridWidth = this.scene.GRID_COLS * cellSize;
    const gridHeight = this.scene.GRID_ROWS * cellSize;
    
    // Left wall
    const leftWall = this.scene.add.image(
      width * 0.18,
      this.scene.gridOffsetY + gridHeight / 2,
      'wall_side'
    ).setOrigin(1, 0.5).setDepth(5);
    leftWall.displayHeight = height;
    leftWall.displayWidth = leftWall.width * (leftWall.displayHeight / leftWall.height);
    
    // Right wall
    const rightWall = this.scene.add.image(
      width * 0.82,
      this.scene.gridOffsetY + gridHeight / 2,
      'wall_side'
    ).setOrigin(0, 0.5).setDepth(5);
    rightWall.displayHeight = height;
    rightWall.displayWidth = rightWall.width * (rightWall.displayHeight / rightWall.height);
    
    // Bottom wall
    const bottomWall = this.scene.add.image(
      width / 2, 
      height, 
      'wall_bottom'
    ).setOrigin(0.5, 1).setDepth(60);
    bottomWall.displayWidth = width;
    bottomWall.displayHeight = height / 5;
    
    // Top wall
    const topWall = this.scene.add.image(
      width / 2, 
      height * 0.1, 
      'wall_top'
    ).setOrigin(0.5, 1).setDepth(6);
    topWall.displayWidth = width;
    topWall.displayHeight = height * 0.1;
    
    // Add castle in the middle top
    const castle = this.scene.add.image(
      width / 2, 
      height * 0.15 + 5, 
      'castle'
    ).setOrigin(0.5, 1).setDepth(50);
    
    // Scale castle properly
    const castleWidth = gridWidth * 0.3; // Castle takes 30% of grid width
    castle.displayWidth = castleWidth;
    castle.displayHeight = castle.height * (castle.displayWidth / castle.width);
  }
  
  // Initialize grid system
  initializeGrid() {
    const cellSize = this.scene.CELL_SIZE;

    // Grid overlay - create it with needed properties
    this.gridGraphics = this.scene.add.graphics();
    this.gridGraphics.setVisible(this.gridVisible);
    this.gridGraphics.setDepth(10); // Set depth for grid lines
    
    // Draw the initial grid
    this.drawGrid();
    
    // Add the path start/end indicators
    this.addPathIndicators();
  }
  
  // Draw the grid lines
  drawGrid() {
    if (!this.gridGraphics) return;
    
    const g = this.gridGraphics;
    const cellSize = this.scene.CELL_SIZE;

    g.clear();
    g.lineStyle(2, 0xffffff, 0.5);
    
    // Explicitly position the graphics object at (0,0)
    g.setPosition(0, 0);
    
    // Clean up any existing coordinate texts
    this.clearGridCoordinates();
  
    for (let y = 0; y < this.scene.GRID_ROWS; y++) {
      for (let x = 0; x < this.scene.GRID_COLS; x++) {
        g.strokeRect(
          this.scene.gridOffsetX + x * cellSize,
          this.scene.gridOffsetY + y * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }
  
  // Clear grid coordinate texts
  clearGridCoordinates() {
    if (this.gridCoordinateTexts && this.gridCoordinateTexts.length > 0) {
      this.gridCoordinateTexts.forEach(text => text.destroy());
      this.gridCoordinateTexts = [];
    }
  }
  
  // Toggle grid visibility
  toggleGrid(visible) {
    this.gridVisible = visible !== undefined ? visible : !this.gridVisible;
    
    if (this.gridGraphics) {
      this.gridGraphics.setVisible(this.gridVisible);
    }
    
    // Update arrow indicators visibility with grid
    this.updateGridIndicatorsVisibility(this.gridVisible);
    
    console.log('Grid toggled:', this.gridVisible ? 'ON' : 'OFF');
    
    if (this.gridVisible) {
      this.drawGrid(); // Redraw with coordinates
    } else {
      this.clearGridCoordinates(); // Clean up coordinates
    }
    
    // Update main scene state to keep in sync
    this.scene.gridVisible = this.gridVisible;
  }

  createButtons() {
    // Common button width for consistency
    const buttonWidth = 140;
    
    // Start/Pause Button
    const pointX = this.scene.cameras.main.width - 80;
    const pointY = 200;

    const startButton = this.scene.add.text(pointX, pointY, 'Start', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: buttonWidth
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
    const restartButtonY = pointY + 60;
    
    const restartButton = this.scene.add.text(pointX, restartButtonY, 'Restart', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#880000',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: buttonWidth
    })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => restartButton.setStyle({ backgroundColor: '#aa0000' }))
      .on('pointerout', () => restartButton.setStyle({ backgroundColor: '#880000' }))
      .on('pointerdown', () => {
        // Clean up ALL game elements
        this.clearPathIndicators();
        this.clearPathVisualization();
        
        // Remove monsters
        if (this.scene.monsterManager) {
          this.scene.monsterManager.removeAllMonsters();
        }
        
        // Reset the game
        console.log('Restarting game...');
        this.scene.game.reset();
        
        // Restart the scene
        this.scene.scene.restart();
      });
    
    this.restartButton = restartButton;
    
    // Grid ON/OFF Button
    const gridButtonY = restartButtonY + 60;
    
    const gridButton = this.scene.add.text(pointX, gridButtonY, 'Grid: OFF', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: buttonWidth
    })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => gridButton.setStyle({ backgroundColor: '#666666' }))
      .on('pointerout', () => gridButton.setStyle({ 
        backgroundColor: this.gridVisible ? '#008800' : '#444444'
      }))
      .on('pointerdown', () => {
        // Toggle grid visibility using our method now
        this.toggleGrid();
        
        if (this.gridVisible) {
          gridButton.setText('Grid: ON');
          gridButton.setStyle({ backgroundColor: '#008800', color: '#ffffff' });
        } else {
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
      align: 'center',
      fixedWidth: buttonWidth
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
    
    // Speed x1/x2 Button
    const speedButtonY = pathButtonY + 60; // Position it below the path button
  
    const speedButton = this.scene.add.text(pointX, speedButtonY, `Speed: x${this.gameSpeed}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { x: 20, y: 10 },
      align: 'center',
      fixedWidth: buttonWidth
    })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => speedButton.setStyle({ backgroundColor: '#666666' }))
      .on('pointerout', () => speedButton.setStyle({ 
        backgroundColor: this.gameSpeed > 1 ? '#008866' : '#444444'
      }))
      .on('pointerdown', () => {
        // Toggle game speed between x1 and x2
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        
        // Update button text and style
        speedButton.setText(`Speed: x${this.gameSpeed}`);
        speedButton.setStyle({ 
          backgroundColor: this.gameSpeed > 1 ? '#008866' : '#444444',
          color: '#ffffff'
        });
        
        this.updateGameSpeed(this.gameSpeed);
      });
      
    this.speedButton = speedButton;
    
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
    
    // Horizontal line below Gun Shop text
    this.scene.add.graphics()
      .lineStyle(2, 0xffffff, 0.8)
      .beginPath()
      .moveTo(10, 40)
      .lineTo(this.scene.SIDE_BAR_WIDTH - 10, 40)
      .closePath()
      .strokePath()
      .setDepth(25);
    
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
    
    // Add start and end point indicators
    this.addPathIndicators();
    
    return this;
  }
  
  // Add green arrow at spawn point and red arrow at end point
  addPathIndicators() {
    // Clear any existing arrows first
    this.clearPathIndicators();
    
    const cellSize = this.scene.getCellSize();
    
    // Calculate start and end positions
    const startCol = Math.floor(this.scene.GRID_COLS / 2);
    const startRow = this.scene.GRID_ROWS - 1;
    const endCol = Math.floor(this.scene.GRID_COLS / 2);
    const endRow = 0;
    
    // Calculate pixel positions for arrows
    const startX = this.scene.gridOffsetX + startCol * cellSize + cellSize / 2;
    const startY = this.scene.gridOffsetY + startRow * cellSize + cellSize / 2;
    const endX = this.scene.gridOffsetX + endCol * cellSize + cellSize / 2;
    const endY = this.scene.gridOffsetY + endRow * cellSize + cellSize / 2;
    
    // Create a container for grid-related indicators that's part of the grid
    this.gridIndicators = this.scene.add.container(0, 0);
    this.gridIndicators.setDepth(15); // Same depth as grid
    this.arrowAnimTimers = []; // Store animation timers for cleanup
    
    // Create green up arrow at spawn point (start)
    this.startArrow = this.createArrow(startX, startY, 0x00ff00, 'up', cellSize);
    this.gridIndicators.add(this.startArrow);
    
    // Create red down arrow at end point
    this.endArrow = this.createArrow(endX, endY, 0xff0000, 'down', cellSize);
    this.gridIndicators.add(this.endArrow);
    
    // Initially set visibility based on grid visibility
    this.updateGridIndicatorsVisibility(this.gridVisible);
    
    // Store start and end cells for later reference
    this.startCell = { col: startCol, row: startRow };
    this.endCell = { col: endCol, row: endRow };
  }
  
  // Clear path indicators and their animation timers
  clearPathIndicators() {
    // Clear animation timers
    if (this.arrowAnimTimers) {
      this.arrowAnimTimers.forEach(timer => {
        if (timer) timer.remove();
      });
      this.arrowAnimTimers = [];
    }
    
    // Clear arrow containers
    if (this.gridIndicators) {
      this.gridIndicators.removeAll(true); // true to destroy children
      this.gridIndicators = null;
    }
    
    this.startArrow = null;
    this.endArrow = null;
  }
  
  // Update grid indicators visibility
  updateGridIndicatorsVisibility(visible) {
    if (this.gridIndicators) {
      this.gridIndicators.setVisible(visible);
    }
  }
  
  // Helper to create an arrow
  createArrow(x, y, color, direction, cellSize) {
    const arrowSize = cellSize * 0.6; // Arrow size relative to cell
    
    // Create container for the arrow at the exact position
    const arrowContainer = this.scene.add.container(x, y);
    arrowContainer.setDepth(15);
    
    // Create arrow graphics - positioned at 0,0 (center of container)
    const arrow = this.scene.add.graphics();
    arrow.fillStyle(color, 0.8);
    
    // Function to draw the arrow at different sizes
    const drawArrow = (size) => {
      // Clear previous drawing
      arrow.clear();
      arrow.fillStyle(color, 0.8);
      arrow.setDepth(15);
      
      if (direction === 'up') {
        // Draw upward pointing arrow centered at 0,0
        arrow.fillTriangle(
          0, -size/2,          // Top point
          -size/3, size/3,     // Bottom left
          size/3, size/3       // Bottom right
        );
      } else if (direction === 'down') {
        // Draw downward pointing arrow centered at 0,0
        arrow.fillTriangle(
          0, size/2,           // Bottom point
          -size/3, -size/3,    // Top left
          size/3, -size/3      // Top right
        );
      }
    };
    
    // Draw initial arrow
    drawArrow(arrowSize);
    
    // Add arrow to the container
    arrowContainer.add(arrow);
    
    // Create pulsing animation using a custom tween that redraws
    // the arrow instead of scaling the graphics object
    let pulseFactor = 1;
    let growing = true;
    
    // Create a timer for smooth pulsing
    const animTimer = this.scene.time.addEvent({
      delay: 50, // Update frequency in ms
      callback: () => {
        // Only animate when game is running
        if (!this.scene.isGameRunning) {
          // Reset to normal size when paused
          if (pulseFactor !== 1) {
            pulseFactor = 1;
            drawArrow(arrowSize * pulseFactor);
          }
          return;
        }
        
        // Update pulse factor - adjust speed based on game speed
        const baseStep = 0.025; // Base pulse step (slower for better visuals)
        const gameSpeedFactor = this.gameSpeed || 1; // Get current game speed
        const pulseStep = baseStep * gameSpeedFactor; // Adjust step by game speed
        const maxPulse = 1.4; // pulse size
        
        if (growing) {
          pulseFactor += pulseStep;
          if (pulseFactor >= maxPulse) {
            pulseFactor = maxPulse;
            growing = false;
          }
        } else {
          pulseFactor -= pulseStep;
          if (pulseFactor <= 1) {
            pulseFactor = 1;
            growing = true;
          }
        }
        
        // Redraw arrow at new size
        drawArrow(arrowSize * pulseFactor);
      },
      callbackScope: this,
      loop: true
    });
    
    // Store the timer for cleanup later
    if (!this.arrowAnimTimers) this.arrowAnimTimers = [];
    this.arrowAnimTimers.push(animTimer);
    
    return arrowContainer;
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
    
    // Missile Launcher Icon in Shop
    const missileLauncherIcon = this.scene.add.image(70, 360, 'missileLauncher')
      .setOrigin(0.5)
      .setScale(0.25)
      .setDepth(25)
      .setRotation(Phaser.Math.DegToRad(180))
      .setInteractive({ draggable: true });

    // Missile Launcher Price Text
    this.scene.add.text(100, 360, '$60', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setDepth(25);
    
    // Setup drag events for cannon
    this.setupDragEvents(cannonIcon, 'cannon', this.scene.CANNON_COST, cellSize);
    
    // Setup drag events for MG
    this.setupDragEvents(mgIcon, 'mg', this.scene.MG_COST, cellSize);
    
    // Setup drag events for Missile Launcher
    this.setupDragEvents(missileLauncherIcon, 'missileLauncher', this.scene.MISSILE_LAUNCHER_COST, cellSize);
    
    return this;
  }
  
  setupDragEvents(icon, type, cost, cellSize) {
    // Track minimal drag distance to distinguish between click and drag
    let dragStartX = 0;
    let dragStartY = 0;
    let dragged = false;
    const MIN_DRAG_DISTANCE = 10; // Minimum pixels to consider it a drag

    icon.on('dragstart', (pointer) => {
      // Store original grid state to restore it later
      this.wasGridVisible = this.scene.gridVisible;
      this.temporaryGridVisibility = false; // Initialize to false
      
      // Store drag start position to detect click vs drag
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      dragged = false;
      
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
      
      // Initialize pendingCell to invalid values
      this.scene.pendingCell = { x: -1, y: -1 };
      
      // Log to console for debugging
      console.log('Dragging started, grid should be visible');
    });

    icon.on('drag', (pointer) => {
      if (!this.scene.pendingCannon) return;
      
      // Check if we've moved enough to consider it a drag
      const dragDistance = Phaser.Math.Distance.Between(dragStartX, dragStartY, pointer.x, pointer.y);
      if (dragDistance >= MIN_DRAG_DISTANCE) {
        dragged = true;
      }
      
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
        
        // Check if cell contains a monster
        const hasMonsterInCell = this.checkIfCellHasMonster(cellX, cellY);
        
        // Basic placement check (cell is within grid, is empty, and has no monster)
        const basicValid = 
          cellX >= 0 && cellY >= 0 &&
          cellX < this.scene.GRID_COLS && cellY < this.scene.GRID_ROWS &&
          this.scene.grid[cellY][cellX] === null &&
          !hasMonsterInCell;
        
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
          // Invalid placement (out of bounds, occupied cell, or has monster) - Red
          this.cellHighlight.setFillStyle(0xff0000, 0.3);
          this.cellHighlight.setVisible(true);
        }
      }
    });
    
    icon.on('dragend', () => {
      // Clean up function for all cases
      const cleanupDrag = () => {
        // Remove cell highlight if it exists
        if (this.cellHighlight) {
          this.cellHighlight.destroy();
          this.cellHighlight = null;
        }
        
        // Remove the temporary tower preview
        if (this.scene.pendingCannon) {
          this.scene.pendingCannon.destroy();
          this.scene.pendingCannon = null;
        }
        
        // Remove the temporary range circle
        if (this.scene.dragRangeCircle) {
          this.scene.dragRangeCircle.destroy();
          this.scene.dragRangeCircle = null;
        }
        
        // Reset pending cell
        this.scene.pendingCell = { x: null, y: null };
        
        // Restore original grid visibility state if we temporarily enabled it
        if (this.temporaryGridVisibility) {
          this.scene.toggleGrid(this.wasGridVisible);
          this.temporaryGridVisibility = false;
        }
      };
      
      // If we haven't dragged enough (just a click), always clean up
      if (!dragged) {
        cleanupDrag();
        return;
      }
      
      // Get cell coordinates
      const { x: cellX, y: cellY } = this.scene.pendingCell;
      
      // Check if placement is valid
      const isValid =
        cellX >= 0 && cellY >= 0 &&
        cellX < this.scene.GRID_COLS && cellY < this.scene.GRID_ROWS &&
        this.scene.grid[cellY][cellX] === null &&
        !this.checkIfPlacementBlocksPath(cellX, cellY) &&
        !this.checkIfCellHasMonster(cellX, cellY);
      
      if (isValid) {
        // We'll keep the preview for the confirmation popup
        // But clean up the cell highlight
        if (this.cellHighlight) {
          this.cellHighlight.destroy();
          this.cellHighlight = null;
        }
        
        // Show confirmation popup - this will handle cleanup after
        this.scene.showConfirmPopup(cellX, cellY);
      } else {
        // Invalid placement - clean up everything
        cleanupDrag();
      }
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
  
  // Check if there's a monster in the cell at (cellX, cellY)
  checkIfCellHasMonster(cellX, cellY) {
    // Make sure monsterManager exists
    if (!this.scene.monsterManager || !this.scene.monsterManager.monsters) {
      return false;
    }
    
    const cellSize = this.scene.getCellSize();
    
    // Calculate cell boundaries with some margin to ensure overlap detection
    const cellLeft = this.scene.gridOffsetX + cellX * cellSize - 5; // Add margin
    const cellRight = this.scene.gridOffsetX + (cellX + 1) * cellSize + 5; // Add margin
    const cellTop = this.scene.gridOffsetY + cellY * cellSize - 5; // Add margin
    const cellBottom = this.scene.gridOffsetY + (cellY + 1) * cellSize + 5; // Add margin
    
    // Track detected monsters for debugging
    const detectedMonsters = [];
    
    // Check each monster to see if it's in this cell
    for (const monster of this.scene.monsterManager.monsters) {
      // Skip monsters that have reached the end or don't have valid position
      if (monster.reachedEnd || !monster.gameObject) continue;
      
      // Get monster position and dimensions
      const monsterX = monster.gameObject.x;
      const monsterY = monster.gameObject.y;
      const monsterWidth = monster.gameObject.width * monster.gameObject.scaleX;
      const monsterHeight = monster.gameObject.height * monster.gameObject.scaleY;
      
      // Calculate monster bounding box
      const monsterLeft = monsterX - monsterWidth/2;
      const monsterRight = monsterX + monsterWidth/2;
      const monsterTop = monsterY - monsterHeight/2;
      const monsterBottom = monsterY + monsterHeight/2;
      
      // Check for ANY overlap between monster and cell
      const overlaps = !(
        monsterRight < cellLeft || 
        monsterLeft > cellRight || 
        monsterBottom < cellTop || 
        monsterTop > cellBottom
      );
      
      if (overlaps) {
        console.log(`Monster detected in cell ${cellX},${cellY}. Position: ${monsterX},${monsterY}`);
        detectedMonsters.push(monster);
        return true; // Monster found in this cell
      }
    }
    
    // No monsters in this cell
    return false;
  }
  
  showUpgradeUI(tower) {
    // Clean up any existing UI first
    this.hideUpgradeUI();
    
    const cellSize = this.scene.CELL_SIZE;
    
    // Create background for buttons
    this.upgradePanel = this.scene.add.rectangle(
      tower.gameObject.x,
      tower.gameObject.y - cellSize * 3,
      cellSize * 2,
      cellSize * 0.7,
      0x000000,
      0.7
    ).setDepth(45);
    
    // Show different UI based on if the tower can be upgraded
    if (tower.level < tower.maxLevel && tower.upgradeCost !== null) {
      // Tower can be upgraded
      this.upgradeButton = this.scene.add.text(
        tower.gameObject.x,
        tower.gameObject.y - cellSize * 2,
        `⬆️ Upgrade: -$${tower.upgradeCost}`,
        {
          fontSize: '20px',
          padding: { x: 10, y: 7 },
          backgroundColor: '#007700',
        }
      ).setOrigin(0.5).setInteractive().setDepth(46);
    } else {
      // Tower at max level, show disabled button
      this.upgradeButton = this.scene.add.text(
        tower.gameObject.x,
        tower.gameObject.y - cellSize * 2,
        `MAX LEVEL`,
        {
          fontSize: '20px',
          padding: { x: 10, y: 7 },
          color: '#999999',
          backgroundColor: '#444444',
        }
      ).setOrigin(0.5).setDepth(46);
    }
    
    // Create delete button with emoji
    this.deleteButton = this.scene.add.text(
      tower.gameObject.x,
      tower.gameObject.y - cellSize,
      `❌ Sell: +$${tower.sellCost}`,
      {
        fontSize: '20px',
        padding: { x: 28, y: 7 },
        backgroundColor: '#770000',
      }
    ).setOrigin(0.5).setInteractive().setDepth(46);
    
    // Add level display
    this.levelText = this.scene.add.text(
      tower.gameObject.x,
      tower.gameObject.y - cellSize * 3,
      `Level: ${tower.level}`,
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 3 }
      }
    ).setOrigin(0.5).setDepth(46);
    
    // Add click handler to the upgrade button
    this.upgradeButton.on('pointerover', () => {
      // Only change style if tower can be upgraded
      if (tower.level < tower.maxLevel && tower.upgradeCost !== null) {
        this.upgradeButton.setStyle({ backgroundColor: '#009900' });
      }
    });
    
    this.upgradeButton.on('pointerout', () => {
      // Only change style if tower can be upgraded
      if (tower.level < tower.maxLevel && tower.upgradeCost !== null) {
        this.upgradeButton.setStyle({ backgroundColor: '#007700' });
      }
    });
    
    this.upgradeButton.on('pointerdown', (pointer, localX, localY, event) => {
      // Only process click if tower can be upgraded
      if (tower.level < tower.maxLevel && tower.upgradeCost !== null) {
        // Safely stop propagation if the event object is available
        if (event && event.stopPropagation) {
          event.stopPropagation();
        } else if (pointer && pointer.event && pointer.event.stopPropagation) {
          pointer.event.stopPropagation();
        }
        
        const success = tower.upgrade();
        if (success) {
          // Update upgrade button text or change to MAX LEVEL if at max
          if (tower.level >= tower.maxLevel || tower.upgradeCost === null) {
            this.upgradeButton.setText(`MAX LEVEL`);
            this.upgradeButton.setStyle({
              backgroundColor: '#444444',
              color: '#999999'
            });
            this.upgradeButton.disableInteractive();
          } else {
            this.upgradeButton.setText(`⬆️ Upgrade: -$${tower.upgradeCost}`);
          }
          this.levelText.setText(`Level: ${tower.level}`);
        } else {
          console.log("Not enough money to upgrade!");
          // Visual feedback for not enough money
          this.scene.tweens.add({
            targets: this.upgradeButton,
            alpha: 0.3,
            yoyo: true,
            duration: 200,
            repeat: 1
          });
        }
      }
    });
    
    // Add click handler to the delete button
    this.deleteButton.on('pointerover', () => {
      this.deleteButton.setStyle({ backgroundColor: '#990000' });
    });
    
    this.deleteButton.on('pointerout', () => {
      this.deleteButton.setStyle({ backgroundColor: '#770000' });
    });
    
    this.deleteButton.on('pointerdown', (pointer, localX, localY, event) => {
      // Safely stop propagation if the event object is available
      if (event && event.stopPropagation) {
        event.stopPropagation();
      } else if (pointer && pointer.event && pointer.event.stopPropagation) {
        pointer.event.stopPropagation();
      }
      
      // Hide UI first
      this.hideUpgradeUI();
      
      // Sell the tower using its sell method
      const refundAmount = tower.sell();
      
      // Show refund amount
      const refundText = this.scene.add.text(
        tower.gameObject.x,
        tower.gameObject.y,
        `+$${refundAmount}`,
        {
          fontSize: '16px',
          color: '#00ff00',
          stroke: '#000000',
          strokeThickness: 3
        }
      ).setOrigin(0.5).setDepth(46);
      
      // Animate refund text floating up and fading
      this.scene.tweens.add({
        targets: refundText,
        y: tower.gameObject.y - 50,
        alpha: 0,
        duration: 1500,
        onComplete: () => refundText.destroy()
      });
    });
  }
  
  hideUpgradeUI() {
    if (this.upgradeButton) {
      this.upgradeButton.destroy();
      this.upgradeButton = null;
    }
    
    if (this.deleteButton) {
      this.deleteButton.destroy();
      this.deleteButton = null;
    }
    
    if (this.upgradePanel) {
      this.upgradePanel.destroy();
      this.upgradePanel = null;
    }
    
    if (this.upgradeText) {
      this.upgradeText.destroy();
      this.upgradeText = null;
    }
    
    if (this.levelText) {
      this.levelText.destroy();
      this.levelText = null;
    }
  }
  
  showConfirmPopup(x, y, options) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    const popup = this.scene.add.rectangle(centerX, centerY, 200, 120, 0x000000, 0.8).setDepth(45);
    const text = this.scene.add.text(centerX, centerY - 30, options.message, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(46);
    
    const yesBtn = this.scene.add.text(centerX - 40, centerY + 20, 'Yes', {
      fontSize: '18px',
      backgroundColor: '#00aa00',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(47);
    
    const noBtn = this.scene.add.text(centerX + 40, centerY + 20, 'No', {
      fontSize: '18px',
      backgroundColor: '#aa0000',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(47);
    
    const destroyPopup = () => {
      popup.destroy();
      text.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    };

    // Handle grid visibility reset after purchase confirmation
    const resetGridVisibility = () => {
      // Check if grid was temporarily enabled for this drag operation
      if (this.temporaryGridVisibility) {
        // Reset to original state (before drag started)
        this.scene.toggleGrid(this.wasGridVisible);
        this.temporaryGridVisibility = false;
      }
    };
    
    yesBtn.on('pointerdown', () => {
      // Final safety check for monsters in the cell
      const hasMonster = this.checkIfCellHasMonster(x, y);
      
      if (hasMonster) {
        console.log("PREVENTED TOWER PLACEMENT: Monster detected in cell at placement time");
        destroyPopup();
        resetGridVisibility();
        
        // Clean up any pending cannon
        if (this.scene.pendingCannon) {
          this.scene.pendingCannon.destroy();
          this.scene.pendingCannon = null;
        }
        
        // Remove range circle if it exists
        if (this.scene.dragRangeCircle) {
          this.scene.dragRangeCircle.destroy();
          this.scene.dragRangeCircle = null;
        }
        
        // Show warning popup
        this.showWarningPopup("Cannot place tower on a monster!");
        return;
      }
      
      if (this.scene.game.money >= this.scene.draggedItemCost) {
        options.onYes();
        destroyPopup();
        resetGridVisibility();
      } else {
        // Not enough money - make sure to cleanup the cannon
        destroyPopup();
        resetGridVisibility();
        
        // Clean up any pending cannon
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
      resetGridVisibility();
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
  
  // Show a warning popup with custom message
  showWarningPopup(message) {
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    
    const popup = this.scene.add.rectangle(centerX, centerY, 400, 90, 0x884400, 0.9).setDepth(40);
    const text = this.scene.add.text(centerX, centerY, message, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 380 }
    }).setOrigin(0.5).setDepth(41);
    
    // Make the popup fade in and out with pulse effect
    this.scene.tweens.add({
      targets: popup,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Add slight pulsing effect to the popup
        this.scene.tweens.add({
          targets: popup,
          scaleX: 1.05,
          scaleY: 1.05,
          yoyo: true,
          repeat: 2,
          duration: 200,
          ease: 'Sine.easeInOut'
        });
        
        // After fade in, wait then fade out
        this.scene.tweens.add({
          targets: [popup, text],
          alpha: { from: 1, to: 0 },
          duration: 300,
          ease: 'Power2',
          delay: 2400,
          onComplete: () => {
            popup.destroy();
            text.destroy();
          }
        });
      }
    });
    
    // Also fade in the text
    this.scene.tweens.add({
      targets: text,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Power2'
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
      // Clean up all game objects to prevent leaks
      this.clearPathIndicators();
      
      // Remove all monsters
      if (this.scene.monsterManager) {
        this.scene.monsterManager.removeAllMonsters();
      }
      
      // Reset the game state
      this.scene.game.reset();
      
      // Restart the scene
      this.scene.scene.restart();
    });
  }
  
  // Method to visualize the monster path when grid is enabled
  updatePathVisualization() {
    // Only proceed if the path visibility is enabled
    if (!this.pathVisible) return;
    
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
  }
  
  // Helper method to draw a path with specified color and alpha
  drawPath(path, color = 0xfeb6363, alpha = 0.8) {
    if (!path || path.length === 0) return;
    
    const pathGraphics = this.pathGraphics;
    
    // Use the constant cell size instead of calculating it
    const cellSize = this.scene.CELL_SIZE;
    
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
        delay: 120, // Update every 60ms for smoother animation
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
    
    // Don't animate when game is paused
    if (!this.scene.isGameRunning) {
      return;
    }
    
    // Animation speed based on game speed (1x or 2x)
    const baseSpeed = 0.5; // Base speed is slightly slower for better visibility
    const speed = baseSpeed * (this.gameSpeed || 1); // Apply current game speed to animation
    const time = this.scene.time.now / 1000; // Current time in seconds
    
    // Debug: Log animation stats occasionally
    if (Math.floor(time) % 5 === 0 && Math.floor(time) !== this.lastLogTime) {
      this.lastLogTime = Math.floor(time);
      console.log('Animation update at time:', time, 
        'Animations:', this.pathAnimations.length,
        'Dots:', this.pathAnimations.reduce((sum, anim) => sum + anim.dots.length, 0),
        'Speed:', speed);
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
            
            // Speed up or slow down pulsation based on game speed
            const pulseSpeedFactor = this.gameSpeed || 1;
            
            // Handle pulsating based on dot type
            if (dot.isSprite) {
              // For sprites, pulsate scale with adjusted speed
              const pulseFactor = 0.3 * Math.sin(time * 3 * pulseSpeedFactor + dot.pulsePhase) + 1;
              dot.gameObject.setScale(dot.baseSize * pulseFactor);
              
              // Also rotate the sprite (adjust rotation speed)
              dot.gameObject.rotation += 0.02 * pulseSpeedFactor;
              
              // Pulse alpha with adjusted speed
              const alphaFactor = 0.2 * Math.sin(time * 2 * pulseSpeedFactor + dot.pulsePhase) + 0.8;
              dot.gameObject.setAlpha(animation.alpha * alphaFactor);
            } else {
              // For circles, pulsate radius with adjusted speed
              const pulseFactor = 0.3 * Math.sin(time * 3 * pulseSpeedFactor + dot.pulsePhase) + 1;
              dot.gameObject.setRadius(dot.baseSize * pulseFactor);
              
              // Pulse alpha with adjusted speed
              const alphaFactor = 0.2 * Math.sin(time * 2 * pulseSpeedFactor + dot.pulsePhase) + 0.8;
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
      0x00ff00, // Green
      0x0000ff, // Blue
      0xffff00, // Yellow
      0xff00ff, // Magenta
      0x00ffff, // Cyan
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
  
  // Update game speed for monsters and towers
  updateGameSpeed(speedFactor) {
    // Store the current game speed for new monsters to use
    this.gameSpeed = speedFactor;
    
    // Log the speed change
    console.log(`Game speed set to x${speedFactor}`);
    
    // Update monster manager spawn rates and existing monster speeds
    if (this.scene.monsterManager) {
      // Update spawn delay
      if (this.scene.monsterManager.updateSpawnSpeed) {
        this.scene.monsterManager.updateSpawnSpeed(speedFactor);
      }
      
      // If we don't have the updateSpawnSpeed method, directly update monsters
      else if (this.scene.monsterManager.monsters) {
        this.scene.monsterManager.monsters.forEach(monster => {
          if (monster) {
            // Base speed is 0.5 cells per second
            const baseSpeed = 0.5;
            monster.speed = baseSpeed * speedFactor;
          }
        });
      }
    }
    
    // Update all towers' firing rate
    for (let row = 0; row < this.scene.GRID_ROWS; row++) {
      for (let col = 0; col < this.scene.GRID_COLS; col++) {
        const tower = this.scene.grid[row] && this.scene.grid[row][col];
        if (tower) {
          // Base fire rate is 3000ms (3 seconds)
          const baseFireRate = 3000;
          tower.fireRate = baseFireRate / speedFactor; // Faster at higher speeds
        }
      }
    }
  }
}
