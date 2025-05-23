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
      this.scene.gridGraphics.setVisible(true);
      this.scene.draggedItemType = type;
      this.scene.draggedItemCost = cost;
      this.scene.draggedItemImageKey = type;

      const scale = cellSize / 300;
      
      const preview = this.scene.add.image(pointer.x, pointer.y, this.scene.draggedItemImageKey)
        .setScale(scale)
        .setAlpha(0.7)
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
      ).setDepth(1);
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
      this.scene.gridGraphics.setVisible(false);
      
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
    ).setScale(buttonScale).setInteractive().setDepth(5);
    
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
    ).setOrigin(0.5).setDepth(5);
    
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
    
    const popup = this.scene.add.rectangle(centerX, centerY, 200, 120, 0x000000, 0.8).setDepth(10);
    const text = this.scene.add.text(centerX, centerY - 30, options.message, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(10);
    
    const yesBtn = this.scene.add.text(centerX - 40, centerY + 20, 'Yes', {
      fontSize: '18px',
      backgroundColor: '#00aa00',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(10);
    
    const noBtn = this.scene.add.text(centerX + 40, centerY + 20, 'No', {
      fontSize: '18px',
      backgroundColor: '#aa0000',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(10);
    
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
} 