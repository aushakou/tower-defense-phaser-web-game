import {
  GRID_ROWS,
  GRID_COLS,
  CELL_SIZE,
  SHOP_HEIGHT,
  SHOP_WIDTH,
  CANNON_COST
} from '../constants/game.js';

export default class MainScreen extends Phaser.Scene {
  constructor() {
    super('MainScreen');
    this.grid = [];
    this.gridGraphics = null;
    this.score = 0;
    this.money = 100;
  }

  preload() {
    this.load.image('background', '/sand_background.png');
    this.load.image('cannon', '/Cannon.png');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const gridWidth = GRID_COLS * CELL_SIZE;
    const gridHeight = GRID_ROWS * CELL_SIZE;
    const gridOffsetX = (this.cameras.main.width - gridWidth) / 2;
    const gridOffsetY = (this.cameras.main.height - 50 - gridHeight) / 2;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;

    // Init grid map
    this.grid = Array.from({ length: 15 }, () => Array(15).fill(null));

    // Background
    this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);

    // Start Button
    const pointX = this.cameras.main.width - 80;
    const pointY = 200;

    const startButton = this.add.text(pointX, pointY, 'Start', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => startButton.setStyle({ backgroundColor: '#0056b3' }))
      .on('pointerout', () => startButton.setStyle({ backgroundColor: '#007bff' }))
      .on('pointerdown', () => {
        console.log('Start button clicked');
        // Add your game start logic here, e.g. this.scene.start('GameScene');
      });

    // Money Text in Top-Right
    this.moneyText = this.add.text(this.cameras.main.width - 20, 20, `Money: $${this.money}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#000000',
      align: 'left'
    }).setOrigin(1, 0); // Right-top corner

    // Score Text in Top-Right
    this.scoreText = this.add.text(this.cameras.main.width - 20, 50, `Score: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#000000',
      align: 'left'
    }).setOrigin(1, 0); // Right-top corner

    // Shop bar
    this.add.rectangle(0, 0, SHOP_WIDTH, SHOP_HEIGHT, 0x000000).setOrigin(0, 0);

    // Shop Label
    this.add.text(20, 10, 'Gun Shop', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });

    // Cannon Icon in Shop
    const cannonIcon = this.add.image(70, 120, 'cannon')
      .setOrigin(0.5)
      .setScale(0.25)
      .setRotation(Phaser.Math.DegToRad(180)) // rotate 180
      .setInteractive({ draggable: true });

    // Cannon Price Text
    this.add.text(100, 120, '$40', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    // Grid overlay
    this.gridGraphics = this.add.graphics({ visible: false });
    this.drawGrid();

    let previewCannon = null;
    let previewCell = { x: null, y: null };

    cannonIcon.on('dragstart', (pointer) => {
      this.gridGraphics.setVisible(true);

      // Create draggable preview
      previewCannon = this.add.image(pointer.x, pointer.y, 'cannon')
      .setScale(0.25)
      .setAlpha(0.7)
      .setRotation(Phaser.Math.DegToRad(180)); // rotate 180
    });

    cannonIcon.on('drag', (pointer) => {
      if (!previewCannon) return;
    
      const localX = pointer.x - this.gridOffsetX;
      const localY = pointer.y - this.gridOffsetY;
    
      const cellX = Math.floor(localX / CELL_SIZE);
      const cellY = Math.floor(localY / CELL_SIZE);
    
      const snappedX = this.gridOffsetX + cellX * CELL_SIZE + CELL_SIZE / 2;
      const snappedY = this.gridOffsetY + cellY * CELL_SIZE + CELL_SIZE / 2;
    
      previewCannon.setPosition(snappedX, snappedY);
      previewCell = { x: cellX, y: cellY };
    });
    
    cannonIcon.on('dragend', () => {
      this.gridGraphics.setVisible(false);
    
      const { x: cellX, y: cellY } = previewCell;
    
      const isValid = (
        cellX >= 0 &&
        cellY >= 0 &&
        cellX < GRID_COLS &&
        cellY < GRID_ROWS &&
        this.grid[cellY][cellX] === null
      );
    
      if (isValid) {
        this.showConfirmPopup(cellX, cellY, previewCannon);
      } else {
        previewCannon?.destroy();
      }
    
      previewCannon = null;
      previewCell = { x: null, y: null };
    });
  }

  drawGrid() {
    const g = this.gridGraphics;
    g.clear();
    g.lineStyle(1, 0xffffff, 0.3);
  
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        g.strokeRect(
          this.gridOffsetX + x * CELL_SIZE,
          this.gridOffsetY + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
  }

  showConfirmPopup(cellX, cellY, previewCannon) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
  
    const popup = this.add.rectangle(centerX, centerY, 200, 120, 0x000000, 0.8).setDepth(10);
    const text = this.add.text(centerX, centerY - 30, 'Buy? $40', {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(10);
  
    const yesBtn = this.add.text(centerX - 40, centerY + 20, 'Yes', {
      fontSize: '18px',
      backgroundColor: '#00aa00',
      color: '#ffffff',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive().setDepth(10);
  
    const noBtn = this.add.text(centerX + 40, centerY + 20, 'No', {
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
      if (this.score >= CANNON_COST) {
        this.score -= CANNON_COST;
        this.scoreText.setText(`Coins: ${this.score}`);
        previewCannon.setAlpha(1);
        this.grid[cellY][cellX] = previewCannon;
      } else {
        previewCannon.destroy();
      }
      destroyPopup();
    });
  
    noBtn.on('pointerdown', () => {
      previewCannon.destroy();
      destroyPopup();
    });
  }  

  update() {
    // Game loop logic
  }
}
