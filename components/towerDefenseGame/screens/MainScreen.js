import {
  GRID_ROWS,
  GRID_COLS,
  SIDE_BAR_WIDTH,
  CANNON_COST,
  MG_COST,
} from '../constants/game.js';

import UIManager from '../managers/UIManager.js';
import CombatManager from '../managers/CombatManager.js';
import PathManager from '../managers/PathManager.js';
import TowerManager from '../managers/TowerManager.js';
import MonsterManager from '../managers/MonsterManager.js';
import GameManager from '../managers/GameManager.js';

export default class MainScreen extends Phaser.Scene {
  constructor() {
    super('MainScreen');
    // Constants for reference in managers
    this.GRID_ROWS = GRID_ROWS;
    this.GRID_COLS = GRID_COLS;
    this.SIDE_BAR_WIDTH = SIDE_BAR_WIDTH;
    this.CANNON_COST = CANNON_COST;
    this.MG_COST = MG_COST;
    
    // Core game state
    this.grid = [];
    this.gridGraphics = null;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    this.gridVisible = false; // Initialize grid visibility
    
    // Dragging state
    this.pendingCannon = null;
    this.pendingCell = { x: null, y: null };
    this.draggedItemType = null;
    this.draggedItemCost = 0;
    this.draggedItemImageKey = null;
    this.dragRangeCircle = null;
  }

  preload() {
    this.load.image('background', '/sand_background.png');
    this.load.image('tower', '/Tower.png');
    this.load.image('cannon', '/Cannon.png');
    this.load.image('mg', '/MG.png');
    this.load.image('monster', '/spiky-monster.png');
    this.load.image('bullet_cannon', '/Bullet_Cannon.png');
    this.load.image('up', '/up.png');
  }

  create() {
    // Initialize managers
    this.game = new GameManager(this);
    this.ui = new UIManager(this);
    this.combatManager = new CombatManager(this);
    this.pathManager = new PathManager(this);
    this.towerManager = new TowerManager(this);
    this.monsterManager = new MonsterManager(this);
    
    // Set up the grid
    this.setupGrid();
    
    // Draw background
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);
    
    // Create UI elements
    this.ui.createStatusBars();
    this.ui.createButtons();
    this.ui.createShopItems();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize game state
    this.score = this.game.score;
    this.money = this.game.money;
    this.health = this.game.health;
    this.isGameRunning = this.game.isGameRunning;
    this.monsters = this.monsterManager.monsters;
    
    // Debug the grid
    this.debugGrid();
  }
  
  setupGrid() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;

    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;

    const gridWidth = GRID_COLS * cellSize;
    const gridHeight = GRID_ROWS * cellSize;
    this.gridOffsetX = (this.cameras.main.width - gridWidth) / 2;
    this.gridOffsetY = (this.cameras.main.height - 50 - gridHeight) / 2;

    // Initialize grid map
    this.grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));

    // Grid overlay - ensure it's created with needed properties
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setVisible(false);
    this.gridGraphics.setDepth(10); // Make sure grid is on top of other elements
    this.drawGrid();
  }
  
  drawGrid() {
    const g = this.gridGraphics;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;

    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;

    g.clear();
    g.lineStyle(2, 0xffffff, 0.5);
    // g.lineStyle(2, 0xffff00, 0.8);  // Thicker, yellow lines with higher alpha
    // g.lineStyle(2, 0x00ffff, 0.7); // Cyan color with good visibility
    
    // Explicitly position the graphics object at (0,0) to ensure it's correctly placed
    g.setPosition(0, 0);
    
    // Clean up any existing coordinate texts
    this.clearGridCoordinates();
  
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        g.strokeRect(
          this.gridOffsetX + x * cellSize,
          this.gridOffsetY + y * cellSize,
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
  
  // Helper method to toggle grid visibility (can be called externally)
  toggleGrid(visible) {
    this.gridVisible = visible !== undefined ? visible : !this.gridVisible;
    this.gridGraphics.setVisible(this.gridVisible);
    
    if (this.gridVisible) {
      this.drawGrid(); // Redraw with coordinates
      this.ui.updatePathVisualization(); // Show path
    } else {
      this.clearGridCoordinates(); // Clean up coordinates
      this.ui.clearPathVisualization(); // Clean up path
    }
  }
  
  setupEventListeners() {
    // Add background click handler to deselect tower
    this.input.on('pointerdown', (pointer) => {
      // Skip this check if click is in the shop area
      if (pointer.x < SIDE_BAR_WIDTH) {
        return;
      }
      
      // Check if click is on a tower
      let clickedOnTower = false;
      
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const tower = this.grid[row] && this.grid[row][col];
          if (tower && tower.gameObject) {
            const bounds = tower.gameObject.getBounds();
            if (bounds.contains(pointer.x, pointer.y)) {
              clickedOnTower = true;
              break;
            }
          }
        }
      }
      
      // If clicked elsewhere and a tower was selected, deselect it
      if (!clickedOnTower && this.towerManager.selectedTower) {
        this.towerManager.deselectTower();
      }
    });
  }
  
  // Implement getter for cell size to use in other classes
  getCellSize() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    return adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;
  }
  
  // Called when a monster reaches the end
  monsterReachedEnd(monster) {
    this.monsterManager.monsterReachedEnd(monster);
  }
  
  // Select a tower
  selectTower(tower) {
    this.towerManager.selectTower(tower);
  }
  
  // Show confirm popup for tower placement
  showConfirmPopup(cellX, cellY) {
    this.towerManager.showConfirmPopup(cellX, cellY);
  }

  update(time, delta) {
    // Only update if game is running
    if (!this.isGameRunning) return;
    
    // Update combat (towers targeting and firing)
    this.combatManager.updateCombat(time, delta);
    
    // Update monsters movement and status
    this.monsterManager.updateMonsters(delta);
  }
  
  // Debug grid modified to respect the grid toggle
  debugGrid() {
    console.log('Grid debug info:');
    console.log('- Camera dimensions:', this.cameras.main.width, this.cameras.main.height);
    console.log('- Grid offset:', this.gridOffsetX, this.gridOffsetY);
    console.log('- Grid rows/cols:', GRID_ROWS, GRID_COLS);
    
    // Don't automatically show the grid anymore - let the toggle button handle it
    
    // Draw a box around the game area to see if grid is positioned correctly
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;
    
    const debugGraphics = this.add.graphics();
    debugGraphics.lineStyle(4, 0xff0000, 1);
    debugGraphics.strokeRect(
      this.gridOffsetX, 
      this.gridOffsetY, 
      GRID_COLS * cellSize, 
      GRID_ROWS * cellSize
    );
    
    // Also fade out after 2 seconds
    this.time.delayedCall(2000, () => {
      debugGraphics.clear();
    });
  }
}
