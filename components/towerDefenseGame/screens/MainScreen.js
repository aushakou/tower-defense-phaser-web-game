import {
  CELL_SIZE,
  SIDE_BAR_WIDTH,
  CANNON_COST,
  MG_COST,
  MISSILE_LAUNCHER_COST,
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
    // Cell size and sidebar constants
    this.CELL_SIZE = CELL_SIZE;
    this.SIDE_BAR_WIDTH = SIDE_BAR_WIDTH;
    this.CANNON_COST = CANNON_COST;
    this.MG_COST = MG_COST;
    this.MISSILE_LAUNCHER_COST = MISSILE_LAUNCHER_COST;
    
    // Grid dimensions will be calculated in create() based on screen size
    this.GRID_ROWS = 0;
    this.GRID_COLS = 0;
    
    // Core game state
    this.grid = [];
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
    console.log('Loading game assets...');
    this.load.image('background', '/sand_background.png');
    this.load.image('tower', '/Tower.png');
    
    // Load tower base images
    this.load.image('cannon', '/Cannon.png');
    this.load.image('mg', '/MG.png');
    this.load.image('missileLauncher', '/Missile_Launcher.png');
    
    // Load upgraded tower images
    this.load.image('Cannon2', '/Cannon2.png');
    this.load.image('Cannon3', '/Cannon3.png');
    this.load.image('MG2', '/MG2.png');
    this.load.image('MG3', '/MG3.png');
    this.load.image('Missile_Launcher2', '/Missile_Launcher2.png');
    this.load.image('Missile_Launcher3', '/Missile_Launcher3.png');
    
    this.load.image('monster', '/spiky-monster.png');
    this.load.image('bullet_cannon', '/Bullet_Cannon.png');
    this.load.image('bullet_mg', '/Bullet_MG.png');
    this.load.image('missile', '/Missile.png');
    this.load.image('up', '/up.png');
    this.load.image('path_dot', '/path_dot.svg');
    
    // Load wall and castle assets
    this.load.image('wall_side', '/wall_side.png');
    this.load.image('wall_top', '/wall_top.png');
    this.load.image('wall_bottom', '/wall_bottom.png');
    this.load.image('castle', '/castle.png');
    
    // Debug loaded textures
    this.load.on('complete', () => {
      console.log('Assets loaded successfully');
      console.log('Textures available:', Object.keys(this.textures.list));
    });
  }

  create() {
    // Calculate grid dimensions based on screen size
    this.calculateGridDimensions();
    
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

    // Add walls and castle
    this.ui.addDecorations();
    
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
  }
  
  setupGrid() {
    const cellSize = this.CELL_SIZE;

    const gridWidth = this.GRID_COLS * cellSize;
    const gridHeight = this.GRID_ROWS * cellSize;
    this.gridOffsetX = (this.cameras.main.width - gridWidth) / 2;
    this.gridOffsetY = (this.cameras.main.height - gridHeight) / 2 + 20;

    // Initialize grid map for tower placement
    this.grid = Array.from({ length: this.GRID_ROWS }, () => Array(this.GRID_COLS).fill(null));

    // Initialize the grid in UIManager
    this.ui.initializeGrid();
  }
  
  // Calculate grid dimensions based on screen size
  calculateGridDimensions() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Calculate rows and columns based on screen dimensions and cell size
    // Use 70% of screen height for the grid height
    const gridHeightPercentage = 0.7;
    this.GRID_ROWS = Math.floor((height * gridHeightPercentage) / this.CELL_SIZE);
    
    // Use 60% of screen width for the grid width
    const gridWidthPercentage = 0.6;
    this.GRID_COLS = Math.floor((width * gridWidthPercentage) / this.CELL_SIZE);
    
    // Ensure GRID_COLS is always odd so there's a middle column
    if (this.GRID_COLS % 2 === 0) {
      this.GRID_COLS--; // Subtract 1 if even to make it odd
    }
    
    console.log(`Calculated grid dimensions: ${this.GRID_ROWS} rows x ${this.GRID_COLS} columns`);
    console.log(`Cell size: ${this.CELL_SIZE}px, Screen: ${width}x${height}`);
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
      
      for (let row = 0; row < this.GRID_ROWS; row++) {
        for (let col = 0; col < this.GRID_COLS; col++) {
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
    return this.CELL_SIZE; // Return the constant cell size
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
    // Update FPS counter
    if (this.ui && typeof this.ui.updateFpsCounter === 'function') {
      this.ui.updateFpsCounter(time);
    }

    // Only update if game is running
    if (!this.isGameRunning) return;
    
    // Update combat (towers targeting and firing)
    this.combatManager.updateCombat(time, delta);
    
    // Update monsters movement and status
    this.monsterManager.updateMonsters(delta);
    
    // Update path animations if path visualization is enabled
    if (this.ui && this.ui.pathVisible) {
      // Log animation update once every 5 seconds for debugging
      if (Math.floor(time/1000) % 5 === 0 && Math.floor(time/1000) !== this.lastAnimLogTime) {
        this.lastAnimLogTime = Math.floor(time/1000);
        console.log('Calling path animation update from game loop');
      }
      this.ui.updatePathAnimations();
    }
  }
}
