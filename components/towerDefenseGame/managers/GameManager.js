export default class GameManager {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;
    this.money = 100;
    this.health = 100;
    this.isGameRunning = false;
  }
  
  startGame() {
    this.isGameRunning = true;
    this.scene.monsterManager.startSpawning();
  }
  
  pauseGame() {
    this.isGameRunning = false;
    this.scene.monsterManager.stopSpawning();
  }
  
  monsterKilled() {
    // Add rewards
    this.score += 10;
    this.money += 10;
    
    // Update displays
    this.updateScoreDisplay();
    this.updateMoneyDisplay();
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.updateHealthDisplay();
    
    // Check for game over
    if (this.health <= 0) {
      this.gameOver();
    }
  }
  
  gameOver() {
    this.isGameRunning = false;
    this.scene.monsterManager.stopSpawning();
    this.scene.ui.showGameOver();
  }
  
  spendMoney(amount) {
    if (this.money >= amount) {
      this.money -= amount;
      this.updateMoneyDisplay();
      return true;
    }
    return false;
  }
  
  addMoney(amount) {
    this.money += amount;
    this.updateMoneyDisplay();
  }
  
  updateHealthDisplay() {
    this.scene.healthText.setText(`Health: ${this.health}`);
  }
  
  updateMoneyDisplay() {
    this.scene.moneyText.setText(`Money: $${this.money}`);
  }
  
  updateScoreDisplay() {
    this.scene.scoreText.setText(`Score: ${this.score}`);
  }
  
  // Helper method to calculate cell size
  getCellSize() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const adjustedWidth = width - 200;
    const adjustedHeight = height - 200;
    return adjustedWidth <= adjustedHeight ? 
           adjustedWidth / this.scene.GRID_COLS : 
           adjustedHeight / this.scene.GRID_ROWS;
  }
  
  // Helper method to convert grid position to pixels
  getPixelPosition(row, col) {
    const cellSize = this.getCellSize();
    return {
      x: this.scene.gridOffsetX + col * cellSize + cellSize / 2,
      y: this.scene.gridOffsetY + row * cellSize + cellSize / 2
    };
  }
  
  // Helper method to convert pixel position to grid
  getGridPosition(x, y) {
    const cellSize = this.getCellSize();
    const localX = x - this.scene.gridOffsetX;
    const localY = y - this.scene.gridOffsetY;
    
    return {
      col: Math.floor(localX / cellSize),
      row: Math.floor(localY / cellSize)
    };
  }
  
  reset() {
    this.score = 0;
    this.money = 100;
    this.health = 100;
    this.isGameRunning = false;
    
    this.updateHealthDisplay();
    this.updateMoneyDisplay();
    this.updateScoreDisplay();
  }
} 