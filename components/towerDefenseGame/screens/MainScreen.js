import {
  GRID_ROWS,
  GRID_COLS,
  SHOP_WIDTH,
  CANNON_COST,
  MG_COST,
} from '../constants/game.js';

export default class MainScreen extends Phaser.Scene {
  constructor() {
    super('MainScreen');
    this.grid = [];
    this.gridGraphics = null;
    this.score = 0;
    this.money = 100;
    this.monsters = [];
    this.paths = {};
    this.isGameRunning = false;
    this.spawnTimer = null;
  }

  preload() {
    this.load.image('background', '/sand_background.png');
    this.load.image('tower', '/Tower.png');
    this.load.image('cannon', '/Cannon.png');
    this.load.image('mg', '/MG.png');
    this.load.image('monster', '/spiky-monster.png');
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
      .on('pointerout', () => startButton.setStyle({ backgroundColor: this.isGameRunning ? '#007bff' : '#000000' }))
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
    this.add.rectangle(0, 0, SHOP_WIDTH, height, 0x000000).setOrigin(0, 0).setAlpha(0.7);

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
      
      this.pendingCannon = preview; // Still use pendingCannon for the visual preview
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
    });
    
    mgIcon.on('dragend', () => {
      this.gridGraphics.setVisible(false);
    
      const { x: cellX, y: cellY } = this.pendingCell;
    
      const isValid =
        cellX >= 0 && cellY >= 0 &&
        cellX < GRID_COLS && cellY < GRID_ROWS &&
        this.grid[cellY][cellX] === null;
    
      if (isValid) {
        this.showConfirmPopup(cellX, cellY); // Pass only cellX and cellY
      } else {
        this.pendingCannon?.destroy();
        this.pendingCannon = null;
      }
    
      this.pendingCell = { x: null, y: null };
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
        this.grid[cellY][cellX] = {
            gameObject: this.pendingCannon,
            type: this.draggedItemType,
            cost: this.draggedItemCost
        };
      } else {
        this.pendingCannon?.destroy();
      }

      this.pendingCannon = null;
      this.draggedItemType = null;
      this.draggedItemCost = 0;
      this.draggedItemImageKey = null;
      destroyPopup();
    });
  
    noBtn.on('pointerdown', () => {
      this.pendingCannon?.destroy();
      this.pendingCannon = null;
      this.draggedItemType = null;
      this.draggedItemCost = 0;
      this.draggedItemImageKey = null;
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
        // Handle what happens when monster reaches the end
        // e.g., reduce player health, remove monster, etc.
      }
    }
  }
  
  update(time, delta) {
    // Only update monsters if game is running
    if (!this.isGameRunning) return;
    
    // Update all monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      
      // Update monster position
      this.updateMonsterPosition(monster, delta);
      
      // Check if monster is dead
      if (monster.hp <= 0) {
        // Remove monster and its HP bar
        monster.gameObject.destroy();
        monster.hpBar.destroy();
        monster.hpBarBg.destroy();
        this.monsters.splice(i, 1);
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
      }
    }
  }
}
