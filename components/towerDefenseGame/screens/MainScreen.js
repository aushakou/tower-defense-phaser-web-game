import {
  GRID_ROWS,
  GRID_COLS,
  SIDE_BAR_WIDTH,
  CANNON_COST,
  MG_COST,
} from '../constants/game.js';

export default class MainScreen extends Phaser.Scene {
  constructor() {
    super('MainScreen');
    this.grid = [];
    this.gridGraphics = null;
    this.score = 0;
    this.health = 100;
    this.money = 100;
    this.monsters = [];
    this.paths = {};
    this.isGameRunning = false;
    this.spawnTimer = null;
    this.selectedTower = null;
    this.upgradeButton = null;
    this.upgradeText = null;
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
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;

    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;

    const gridWidth = GRID_COLS * cellSize;
    const gridHeight = GRID_ROWS * cellSize;
    const gridOffsetX = (this.cameras.main.width - gridWidth) / 2;
    const gridOffsetY = (this.cameras.main.height - 50 - gridHeight) / 2;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;

    this.pendingCannon = null;
    this.pendingCell = { x: null, y: null };
    this.draggedItemType = null;
    this.draggedItemCost = 0;
    this.draggedItemImageKey = null;

    // Init grid map
    this.grid = Array.from({ length: 15 }, () => Array(15).fill(null));

    // Background
    this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);

    // Stats bar
    this.add.rectangle(this.cameras.main.width - SIDE_BAR_WIDTH, 0, SIDE_BAR_WIDTH, height, 0x000000).setOrigin(0, 0).setAlpha(0.7);
  
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
      .on('pointerover', () => startButton.setStyle({ backgroundColor: '#ffffff', color: '#000000' }))
      .on('pointerout', () => startButton.setStyle({ backgroundColor: this.isGameRunning ? '#ffc400' : '#000000', color: this.isGameRunning ? '#000000' : '#ffffff' }))
      .on('pointerdown', () => {
        if (!this.isGameRunning) {
          // Start the game
          console.log('Starting game...');
          this.isGameRunning = true;
          startButton.setText('Pause');
          
          // Spawn first monster immediately
          this.spawnMonster();
          
          // Set up timer for spawning monsters every 10 seconds
          this.spawnTimer = this.time.addEvent({
            delay: 10000,
            callback: this.spawnMonster,
            callbackScope: this,
            loop: true
          });
        } else {
          // Pause the game
          console.log('Pausing game...');
          this.isGameRunning = false;
          startButton.setText('Start');
          
          // Stop spawning new monsters
          if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
          }
        }
      });

    
    // Health Text in Top-Right
    this.healthText = this.add.text(this.cameras.main.width - 20, 20, `Health: ${this.health}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'left'
    }).setOrigin(1, 0); // Right-top corner

    // Money Text in Top-Right
    this.moneyText = this.add.text(this.cameras.main.width - 20, 50, `Money: $${this.money}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'left'
    }).setOrigin(1, 0); // Right-top corner

    // Score Text in Top-Right
    this.scoreText = this.add.text(this.cameras.main.width - 20, 80, `Score: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'left'
    }).setOrigin(1, 0); // Right-top corner

    // Shop bar
    this.add.rectangle(0, 0, SIDE_BAR_WIDTH, height, 0x000000).setOrigin(0, 0).setAlpha(0.7);

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
    this.add.text(100, 120, '$20', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    // Cannon Icon in Shop
    const mgIcon = this.add.image(70, 240, 'mg')
      .setOrigin(0.5)
      .setScale(0.25)
      .setRotation(Phaser.Math.DegToRad(180)) // rotate 180
      .setInteractive({ draggable: true });

    // Cannon Price Text
    this.add.text(100, 240, '$40', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });

    // Grid overlay
    this.gridGraphics = this.add.graphics({ visible: false });
    this.drawGrid();

    cannonIcon.on('dragstart', (pointer) => {
      this.gridGraphics.setVisible(true);
      this.draggedItemType = 'cannon';
      this.draggedItemCost = CANNON_COST;
      this.draggedItemImageKey = 'cannon';

      const scale = cellSize / 300;
    
      const preview = this.add.image(pointer.x, pointer.y, this.draggedItemImageKey)
        .setScale(scale)
        .setAlpha(0.7)
        .setRotation(Phaser.Math.DegToRad(180));
    
      this.pendingCannon = preview;
      
      // Show temporary range visualization during drag
      let firingRange = 3 * cellSize; // 3 cell radius for cannon
      this.dragRangeCircle = this.add.circle(
        preview.x,
        preview.y,
        firingRange,
        0x00ff00,
        0.2
      ).setDepth(1);
    });

    cannonIcon.on('drag', (pointer) => {
      if (!this.pendingCannon) return;
    
      const localX = pointer.x - this.gridOffsetX;
      const localY = pointer.y - this.gridOffsetY;
    
      const cellX = Math.floor(localX / cellSize);
      const cellY = Math.floor(localY / cellSize);
    
      const snappedX = this.gridOffsetX + cellX * cellSize + cellSize / 2;
      const snappedY = this.gridOffsetY + cellY * cellSize + cellSize / 2;
    
      this.pendingCannon.setPosition(snappedX, snappedY);
      this.pendingCell = { x: cellX, y: cellY };
      
      // Update range circle position
      if (this.dragRangeCircle) {
        this.dragRangeCircle.setPosition(snappedX, snappedY);
      }
    });
    
    cannonIcon.on('dragend', () => {
      this.gridGraphics.setVisible(false);
    
      const { x: cellX, y: cellY } = this.pendingCell;
    
      const isValid =
        cellX >= 0 && cellY >= 0 &&
        cellX < GRID_COLS && cellY < GRID_ROWS &&
        this.grid[cellY][cellX] === null;
    
      if (isValid) {
        this.showConfirmPopup(cellX, cellY);
      } else {
        this.pendingCannon?.destroy();
        this.pendingCannon = null;
      }
    
      // Remove the temporary range circle
      if (this.dragRangeCircle) {
        this.dragRangeCircle.destroy();
        this.dragRangeCircle = null;
      }
      
      this.pendingCell = { x: null, y: null };
    });

    // MG Icon Drag Handlers
    mgIcon.on('dragstart', (pointer) => {
      this.gridGraphics.setVisible(true);
      this.draggedItemType = 'mg';
      this.draggedItemCost = MG_COST;
      this.draggedItemImageKey = 'mg';

      const scale = cellSize / 300;

      const preview = this.add.image(pointer.x, pointer.y, this.draggedItemImageKey)
        .setScale(scale)
        .setAlpha(0.7)
        .setRotation(Phaser.Math.DegToRad(180));
      
      this.pendingCannon = preview;
      
      // Show temporary range visualization during drag
      let firingRange = 2 * cellSize; // 2 cell radius for MG
      this.dragRangeCircle = this.add.circle(
        preview.x,
        preview.y,
        firingRange,
        0x00ff00,
        0.2
      ).setDepth(1);
    });

    mgIcon.on('drag', (pointer) => {
      if (!this.pendingCannon) return;
    
      const localX = pointer.x - this.gridOffsetX;
      const localY = pointer.y - this.gridOffsetY;
    
      const cellX = Math.floor(localX / cellSize);
      const cellY = Math.floor(localY / cellSize);
    
      const snappedX = this.gridOffsetX + cellX * cellSize + cellSize / 2;
      const snappedY = this.gridOffsetY + cellY * cellSize + cellSize / 2;
    
      this.pendingCannon.setPosition(snappedX, snappedY);
      this.pendingCell = { x: cellX, y: cellY };
      
      // Update range circle position
      if (this.dragRangeCircle) {
        this.dragRangeCircle.setPosition(snappedX, snappedY);
      }
    });
    
    mgIcon.on('dragend', () => {
      this.gridGraphics.setVisible(false);
    
      const { x: cellX, y: cellY } = this.pendingCell;
    
      const isValid =
        cellX >= 0 && cellY >= 0 &&
        cellX < GRID_COLS && cellY < GRID_ROWS &&
        this.grid[cellY][cellX] === null;
    
      if (isValid) {
        this.showConfirmPopup(cellX, cellY);
      } else {
        this.pendingCannon?.destroy();
        this.pendingCannon = null;
      }
      
      // Remove the temporary range circle
      if (this.dragRangeCircle) {
        this.dragRangeCircle.destroy();
        this.dragRangeCircle = null;
      }
    
      this.pendingCell = { x: null, y: null };
    });
    
    // Add background click handler to deselect tower
    this.input.on('pointerdown', (pointer) => {
      // Check if click is on a tower
      let clickedOnTower = false;
      
      // Skip this check if click is in the shop area
      if (pointer.x < SIDE_BAR_WIDTH) {
        return;
      }
      
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
      if (!clickedOnTower && this.selectedTower) {
        this.deselectTower();
      }
    });
  }

  drawGrid() {
    const g = this.gridGraphics;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;

    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;

    g.clear();
    g.lineStyle(1, 0xffffff, 0.3);
  
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

  deselectTower() {
    // Hide range visualization and upgrade UI
    if (this.selectedTower) {
      if (this.selectedTower.rangeCircle) {
        this.selectedTower.rangeCircle.setVisible(false);
      }
      this.selectedTower = null;
    }
    
    // Destroy upgrade button and text if they exist
    if (this.upgradeButton) {
      this.upgradeButton.destroy();
      this.upgradeButton = null;
    }
    
    if (this.upgradeText) {
      this.upgradeText.destroy();
      this.upgradeText = null;
    }
  }

  showConfirmPopup(cellX, cellY) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
  
    const popup = this.add.rectangle(centerX, centerY, 200, 120, 0x000000, 0.8).setDepth(10);
    const text = this.add.text(centerX, centerY - 30, `Buy? $${this.draggedItemCost}`, {
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
      console.log('Yes button clicked');
      console.log(this.draggedItemCost);
      if (this.money >= this.draggedItemCost) {
        this.money -= this.draggedItemCost;
        this.moneyText.setText(`Money: $${this.money}`);
        this.pendingCannon.setAlpha(1);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const adjustedWidth = width - 200;
        const adjustedHeight = height - 200;
        const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;
        
        // Create firing range circle (initially hidden)
        let firingRange = 3 * cellSize; // 3 cell radius for cannon
        if (this.draggedItemType === 'mg') {
          firingRange = 2 * cellSize; // 2 cell radius for MG
        }
        
        // Create a firing range indicator circle (initially hidden)
        const rangeCircle = this.add.circle(
          this.pendingCannon.x,
          this.pendingCannon.y,
          firingRange,
          0x00ff00,
          0.2
        ).setDepth(1).setVisible(false);
        
        // Make tower interactive
        this.pendingCannon.setInteractive();
        
        // Store tower data with extended properties
        const tower = {
          gameObject: this.pendingCannon,
          type: this.draggedItemType,
          cost: this.draggedItemCost,
          position: { row: cellY, col: cellX },
          rangeCircle: rangeCircle,
          range: firingRange,
          lastFired: 0,
          fireRate: 3000, // fire every 3 seconds (in ms)
          damage: 20,
          bullets: [],
          level: 1,
          upgradeCost: 50
        };
        
        this.grid[cellY][cellX] = tower;
        
        // Add click handler to the tower
        this.pendingCannon.on('pointerdown', () => {
          // First, deselect any previously selected tower
          this.deselectTower();
          
          // Select this tower
          this.selectedTower = tower;
          
          // Show range visualization
          tower.rangeCircle.setVisible(true);
          
          // Create upgrade button and text
          const width = this.cameras.main.width;
          const height = this.cameras.main.height;
          const adjustedWidth = width - 200;
          const adjustedHeight = height - 200;
          const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;
          
          const buttonScale = cellSize / 200; // Adjust this based on your up.png size
          
          this.upgradeButton = this.add.image(
            tower.gameObject.x,
            tower.gameObject.y - cellSize,
            'up'
          ).setScale(buttonScale).setInteractive().setDepth(5);
          
          this.upgradeText = this.add.text(
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
            
            if (this.money >= tower.upgradeCost) {
              // Upgrade the tower
              this.money -= tower.upgradeCost;
              this.moneyText.setText(`Money: $${this.money}`);
              
              tower.level++;
              tower.damage += 10; // Increase damage by 10 per level
              tower.fireRate *= 0.8; // Reduce fire rate by 20% (fire faster)
              tower.range *= 1.2; // Increase range by 20%
              tower.upgradeCost = Math.floor(tower.upgradeCost * 1.5); // Increase upgrade cost
              
              // Update range circle
              tower.rangeCircle.setRadius(tower.range);
              
              // Update upgrade button text
              this.upgradeText.setText(`Upgrade for $${tower.upgradeCost}`);
              
              console.log(`Tower upgraded to level ${tower.level}!`);
            } else {
              console.log("Not enough money to upgrade!");
              // Could add a visual feedback here showing not enough money
            }
          });
        });
      } else {
        this.pendingCannon?.destroy();
      }

      this.pendingCannon = null;
      destroyPopup();
    });
  
    noBtn.on('pointerdown', () => {
      this.pendingCannon?.destroy();
      this.pendingCannon = null;
      destroyPopup();
    });
  }

  spawnMonster() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;
    
    // Get bottom middle cell
    const startCol = Math.floor(GRID_COLS / 2);
    const startRow = GRID_ROWS - 1;
    
    // Get top middle cell
    const endCol = Math.floor(GRID_COLS / 2);
    const endRow = 0;
    
    // Spawn position (bottom middle)
    const spawnX = this.gridOffsetX + startCol * cellSize + cellSize / 2;
    const spawnY = this.gridOffsetY + startRow * cellSize + cellSize / 2;
    
    // Calculate path using Dijkstra
    const path = this.findPath({ row: startRow, col: startCol }, { row: endRow, col: endCol });
    
    if (!path || path.length === 0) {
      console.error("No path found!");
      return;
    }
    
    // Create monster
    const scale = cellSize / 500; // Adjust this value based on your monster image size
    const monster = this.add.image(spawnX, spawnY, 'monster')
      .setScale(scale)
      .setOrigin(0.5);
    
    // Add monster data
    const monsterData = {
      gameObject: monster,
      hp: 100,
      maxHp: 100,
      path: path,
      currentPathIndex: 0,
      speed: 1, // Cells per second
      startTime: this.time.now,
      position: { row: startRow, col: startCol }
    };
    
    // Create HP bar
    const hpBarWidth = cellSize * 0.8;
    const hpBarHeight = 5;
    const hpBarBg = this.add.rectangle(
      monster.x, 
      monster.y - cellSize/2 - 10, 
      hpBarWidth, 
      hpBarHeight, 
      0x333333
    ).setOrigin(0.5, 0.5);
    
    const hpBar = this.add.rectangle(
      monster.x - hpBarWidth/2, 
      monster.y - cellSize/2 - 10, 
      hpBarWidth, 
      hpBarHeight, 
      0x00ff00
    ).setOrigin(0, 0.5);
    
    monsterData.hpBar = hpBar;
    monsterData.hpBarBg = hpBarBg;
    
    this.monsters.push(monsterData);
    
    console.log("Monster spawned with path:", path);
  }
  
  findPath(start, end) {
    // Simplified pathfinding with Dijkstra's algorithm
    // First, create graph representation
    const graph = {};
    
    // Create a key for each node
    const getNodeKey = (row, col) => `${row},${col}`;
    
    // Initialize graph with all valid cells
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const nodeKey = getNodeKey(row, col);
        graph[nodeKey] = {};
        
        // Check if cell is blocked (has a tower)
        const cell = this.grid[row] && this.grid[row][col];
        const isBlocked = cell && (typeof cell === 'object' && cell.gameObject);
        
        if (!isBlocked) {
          // Add edges to adjacent cells (4-directional)
          const adjacentCells = [
            { row: row-1, col: col }, // Up
            { row: row+1, col: col }, // Down
            { row: row, col: col-1 }, // Left
            { row: row, col: col+1 }  // Right
          ];
          
          for (const adjacent of adjacentCells) {
            if (adjacent.row >= 0 && adjacent.row < GRID_ROWS && 
                adjacent.col >= 0 && adjacent.col < GRID_COLS) {
              const adjKey = getNodeKey(adjacent.row, adjacent.col);
              const adjCell = this.grid[adjacent.row] && this.grid[adjacent.row][adjacent.col];
              const isAdjBlocked = adjCell && (typeof adjCell === 'object' && adjCell.gameObject);
              
              if (!isAdjBlocked) {
                // Edge weight is 1 for all connections
                graph[nodeKey][adjKey] = 1;
              }
            }
          }
        }
      }
    }
    
    // Implement Dijkstra's algorithm
    const startKey = getNodeKey(start.row, start.col);
    const endKey = getNodeKey(end.row, end.col);
    
    // If start or end is invalid, return empty path
    if (!graph[startKey] || !graph[endKey]) {
      return [];
    }
    
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    
    // Initialize distances
    Object.keys(graph).forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
      unvisited.add(node);
    });
    
    distances[startKey] = 0;
    
    while (unvisited.size > 0) {
      // Find the unvisited node with the smallest distance
      let current = null;
      let smallestDistance = Infinity;
      
      for (const node of unvisited) {
        if (distances[node] < smallestDistance) {
          smallestDistance = distances[node];
          current = node;
        }
      }
      
      // If we found the end node or there are no more paths
      if (current === endKey || current === null) {
        break;
      }
      
      unvisited.delete(current);
      
      // Update distances to neighbors
      for (const neighbor in graph[current]) {
        if (unvisited.has(neighbor)) {
          const alt = distances[current] + graph[current][neighbor];
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = current;
          }
        }
      }
    }
    
    // Build the path from end to start
    const path = [];
    let current = endKey;
    
    // If end is unreachable
    if (previous[current] === null && current !== startKey) {
      return [];
    }
    
    while (current) {
      const [row, col] = current.split(',').map(Number);
      path.unshift({ row, col });
      current = previous[current];
    }
    
    return path;
  }
  
  updateMonsterPosition(monster, delta) {
    if (!monster || monster.currentPathIndex >= monster.path.length - 1) return;
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;
    
    // Calculate time-based movement
    const timeElapsed = delta / 10;
    const distanceToMove = monster.speed * timeElapsed;
    
    // Current and next position in the path
    const current = monster.path[monster.currentPathIndex];
    const next = monster.path[monster.currentPathIndex + 1];
    
    // Calculate grid positions
    const currentX = this.gridOffsetX + current.col * cellSize + cellSize / 2;
    const currentY = this.gridOffsetY + current.row * cellSize + cellSize / 2;
    const nextX = this.gridOffsetX + next.col * cellSize + cellSize / 2;
    const nextY = this.gridOffsetY + next.row * cellSize + cellSize / 2;
    
    // Direction and distance
    const dx = nextX - currentX;
    const dy = nextY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // How far we can move this frame
    const ratio = Math.min(distanceToMove, distance) / distance;
    
    // Update position
    const newX = monster.gameObject.x + dx * ratio;
    const newY = monster.gameObject.y + dy * ratio;
    
    monster.gameObject.x = newX;
    monster.gameObject.y = newY;
    
    // Update HP bar position
    if (monster.hpBar && monster.hpBarBg) {
      monster.hpBarBg.x = newX;
      monster.hpBarBg.y = newY - cellSize/2 - 10;
      monster.hpBar.x = newX - monster.hpBar.width/2;
      monster.hpBar.y = newY - cellSize/2 - 10;
    }
    
    // If we've reached the next point in the path
    if (Math.abs(monster.gameObject.x - nextX) < 2 && Math.abs(monster.gameObject.y - nextY) < 2) {
      monster.currentPathIndex++;
      monster.position = { row: next.row, col: next.col };
      
      // Check if monster reached the end
      if (monster.currentPathIndex >= monster.path.length - 1) {
        console.log("Monster reached the end!");
        
        // Reduce player health by 20 points
        this.health -= 20;
        this.healthText.setText(`Health: ${this.health}`);
        
        // Create a flash effect to indicate damage
        const flashEffect = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xff0000, 0.3);
        flashEffect.setDepth(100);
        
        // Make it disappear after a short time
        this.tweens.add({
          targets: flashEffect,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            flashEffect.destroy();
          }
        });
        
        // Remove monster and its HP bar
        monster.gameObject.destroy();
        monster.hpBar.destroy();
        monster.hpBarBg.destroy();
        
        // Mark the monster for removal from the monsters array
        monster.reachedEnd = true;
        
        // Check for game over
        if (this.health <= 0) {
          this.showGameOver();
        }
      }
    }
  }
  
  // Add a game over method
  showGameOver() {
    // Pause the game
    this.isGameRunning = false;
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
    
    // Show game over message
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    
    const gameOverText = this.add.text(centerX, centerY - 50, 'GAME OVER', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ff0000',
      fontWeight: 'bold'
    }).setOrigin(0.5).setDepth(100);
    
    const scoreText = this.add.text(centerX, centerY + 30, `Final Score: ${this.score}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(100);
    
    // Add restart button
    const restartButton = this.add.text(centerX, centerY + 100, 'RESTART', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().setDepth(100);
    
    restartButton.on('pointerover', () => restartButton.setStyle({ backgroundColor: '#333333' }));
    restartButton.on('pointerout', () => restartButton.setStyle({ backgroundColor: '#000000' }));
    restartButton.on('pointerdown', () => {
      // Restart the scene
      this.scene.restart();
    });
  }
  
  // Add new method to check if monster is within tower's range
  isMonsterInRange(tower, monster) {
    if (!tower || !monster || !tower.gameObject || !monster.gameObject) return false;
    
    const dx = tower.gameObject.x - monster.gameObject.x;
    const dy = tower.gameObject.y - monster.gameObject.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= tower.range;
  }
  
  // Add method to handle tower firing
  fireTower(tower, monster, time) {
    if (!tower || !monster) return;
    
    const timeSinceLastFire = time - tower.lastFired;
    
    // Calculate angle to monster
    const dx = monster.gameObject.x - tower.gameObject.x;
    const dy = monster.gameObject.y - tower.gameObject.y;
    const angle = Math.atan2(dy, dx);
    
    // Rotate tower to face monster with a +90 degree correction
    // Changed from -90 to +90 degrees to fix the 180-degree offset
    tower.gameObject.rotation = angle + Math.PI/2;
    
    // Check if tower can fire again based on fire rate
    if (timeSinceLastFire >= tower.fireRate) {
      tower.lastFired = time;
      
      // Create bullet
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      const adjustedWidth = width - 200;
      const adjustedHeight = height - 200;
      const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / GRID_COLS : adjustedHeight / GRID_ROWS;
      
      const bulletScale = cellSize / 700; // Adjust based on your bullet image size
      
      const bullet = this.add.image(
        tower.gameObject.x,
        tower.gameObject.y,
        'bullet_cannon'
      ).setScale(bulletScale).setDepth(5);
      
      // Store bullet data
      const bulletData = {
        gameObject: bullet,
        targetMonster: monster,
        speed: 500, // pixels per second
        damage: tower.damage,
        active: true
      };
      
      tower.bullets.push(bulletData);
    }
  }
  
  // Add method to update bullets
  updateBullets(delta) {
    // First, update all tower bullets
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const tower = this.grid[row] && this.grid[row][col];
        
        if (tower && tower.bullets && tower.bullets.length > 0) {
          // Update each bullet from this tower
          for (let i = tower.bullets.length - 1; i >= 0; i--) {
            const bullet = tower.bullets[i];
            
            if (!bullet.active || !bullet.gameObject || !bullet.targetMonster || 
                !bullet.targetMonster.gameObject || bullet.targetMonster.hp <= 0) {
              // Clean up inactive bullets or bullets with invalid targets
              if (bullet.gameObject) {
                bullet.gameObject.destroy();
              }
              tower.bullets.splice(i, 1);
              continue;
            }
            
            // Calculate direction to target
            const targetX = bullet.targetMonster.gameObject.x;
            const targetY = bullet.targetMonster.gameObject.y;
            const bulletX = bullet.gameObject.x;
            const bulletY = bullet.gameObject.y;
            
            const dx = targetX - bulletX;
            const dy = targetY - bulletY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check for hit
            if (distance < 20) { // Hit radius - adjust as needed
              // Hit the monster
              bullet.targetMonster.hp -= bullet.damage;
              
              // Update HP bar
              if (bullet.targetMonster.hpBar) {
                const hpRatio = Math.max(0, bullet.targetMonster.hp / bullet.targetMonster.maxHp);
                bullet.targetMonster.hpBar.width = bullet.targetMonster.hpBarBg.width * hpRatio;
                
                // Change HP bar color based on health
                if (hpRatio < 0.3) {
                  bullet.targetMonster.hpBar.fillColor = 0xff0000; // Red when low health
                } else if (hpRatio < 0.6) {
                  bullet.targetMonster.hpBar.fillColor = 0xffff00; // Yellow when medium health
                }
              }
              
              // Destroy bullet
              bullet.gameObject.destroy();
              tower.bullets.splice(i, 1);
              continue;
            }
            
            // Move bullet towards target
            const timeElapsed = delta / 1000; // Convert ms to seconds
            const distanceToMove = bullet.speed * timeElapsed;
            
            // Calculate normalized direction
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            // Move bullet
            bullet.gameObject.x += normalizedDx * distanceToMove;
            bullet.gameObject.y += normalizedDy * distanceToMove;
            
            // Rotate bullet to face direction of travel
            const angle = Math.atan2(dy, dx);
            bullet.gameObject.rotation = angle;
          }
        }
      }
    }
  }

  update(time, delta) {
    // Only update if game is running
    if (!this.isGameRunning) return;
    
    // Check for towers to fire at monsters in range
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const tower = this.grid[row] && this.grid[row][col];
        
        if (tower && (tower.type === 'cannon' || tower.type === 'mg')) {
          // For each tower, check monsters in range
          let closestMonster = null;
          let closestDistance = Infinity;
          
          for (const monster of this.monsters) {
            if (this.isMonsterInRange(tower, monster)) {
              // Calculate distance to find closest monster
              const dx = tower.gameObject.x - monster.gameObject.x;
              const dy = tower.gameObject.y - monster.gameObject.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < closestDistance) {
                closestDistance = distance;
                closestMonster = monster;
              }
            }
          }
          
          // Fire at closest monster in range
          if (closestMonster) {
            this.fireTower(tower, closestMonster, time);
          }
        }
      }
    }
    
    // Update bullets
    this.updateBullets(delta);
    
    // Update monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      
      // Update monster position
      this.updateMonsterPosition(monster, delta);
      
      // Check if monster is dead or has reached the end
      if (monster.hp <= 0 || monster.reachedEnd) {
        // If monster was killed by towers (not by reaching the end)
        if (monster.hp <= 0 && !monster.reachedEnd) {
          // Remove monster and its HP bar
          monster.gameObject.destroy();
          monster.hpBar.destroy();
          monster.hpBarBg.destroy();
          
          // Add score and money rewards
          this.score += 10;
          this.money += 10;
          
          // Update displays
          this.scoreText.setText(`Score: ${this.score}`);
          this.moneyText.setText(`Money: $${this.money}`);
        }
        
        // Remove from array in either case
        this.monsters.splice(i, 1);
      }
    }
  }
}
