export default class Tower {
  constructor(scene, options) {
    this.scene = scene;
    this.position = { row: options.row, col: options.col };
    this.type = options.type;
    this.level = options.level || 1;
    this.maxLevel = 3;
    
    // Core stats - will be set by child classes
    this.buyCost = 0;
    this.sellCost = 0;
    this.upgradeCost = 0;
    this.damage = 0;
    this.fireRate = 0; 
    this.range = 0;
    this.bulletType = 'bullet_cannon'; // Default bullet type
    
    this.lastFired = 0;
    this.bullets = [];
    
    console.log("Creating tower of type:", options.type, "with image:", options.imageKey);
    
    // First place the tower base
    this.towerBase = scene.add.image(
      options.x,
      options.y,
      'tower'
    ).setScale(options.scale)
     .setAlpha(0.8)
     .setDepth(30);
    
    // Then place the specific tower on top
    this.gameObject = scene.add.image(
      options.x,
      options.y,
      options.imageKey
    ).setScale(options.scale)
     .setDepth(35) // Higher depth to be above the base
     .setInteractive();
    
    // Create range circle (initially hidden)
    // We'll set the proper radius after updateStats is called
    this.rangeCircle = scene.add.circle(
      options.x,
      options.y,
      1, // Placeholder radius, will be updated
      0x00ff00,
      0.2
    ).setDepth(12).setVisible(false);
    
    // Add click handler
    this.setupInteraction();
  }
  
  setupInteraction() {
    this.gameObject.on('pointerdown', () => {
      this.scene.selectTower(this);
    });
  }
  
  isMonsterInRange(monster) {
    if (!monster || !monster.gameObject) return false;
    
    const dx = this.gameObject.x - monster.gameObject.x;
    const dy = this.gameObject.y - monster.gameObject.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= this.range;
  }
  
  findTarget(monsters) {
    let closestMonster = null;
    let closestDistance = Infinity;
    
    for (const monster of monsters) {
      if (this.isMonsterInRange(monster)) {
        // Calculate distance to find closest monster
        const dx = this.gameObject.x - monster.gameObject.x;
        const dy = this.gameObject.y - monster.gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestMonster = monster;
        }
      }
    }
    
    return closestMonster;
  }
  
  fire(monster, time) {
    if (!monster) return;
    
    const timeSinceLastFire = time - this.lastFired;
    
    // Calculate angle to monster
    const dx = monster.gameObject.x - this.gameObject.x;
    const dy = monster.gameObject.y - this.gameObject.y;
    const angle = Math.atan2(dy, dx);
    
    // Rotate tower to face monster with a +90 degree correction
    this.gameObject.rotation = angle + Math.PI/2;
    
    // Check if tower can fire again based on fire rate
    if (timeSinceLastFire >= this.fireRate) {
      this.lastFired = time;
      
      // Create bullet
      const cellSize = this.scene.getCellSize();
      const bulletScale = cellSize / 700; // Adjust based on bullet image size
      
      // Make sure bulletType is valid
      const bulletTexture = this.bulletType || 'bullet_cannon';
      
      console.log(`Tower ${this.type} firing with bullet: ${bulletTexture}`);
      
      // Check if the texture exists
      if (!this.scene.textures.exists(bulletTexture)) {
        console.error(`Missing bullet texture: ${bulletTexture}`);
        console.log("Available textures:", Object.keys(this.scene.textures.list));
        return;
      }
      
      const bullet = this.scene.add.image(
        this.gameObject.x,
        this.gameObject.y,
        bulletTexture
      ).setScale(bulletScale).setDepth(5);
      
      // Store bullet data
      const bulletData = {
        gameObject: bullet,
        targetMonster: monster,
        speed: 500, // pixels per second
        damage: this.damage,
        active: true
      };
      
      this.bullets.push(bulletData);
    }
  }
  
  updateBullets(delta) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      if (!bullet.active || !bullet.gameObject || !bullet.targetMonster || 
          !bullet.targetMonster.gameObject || bullet.targetMonster.hp <= 0) {
        // Clean up inactive bullets or bullets with invalid targets
        if (bullet.gameObject) {
          bullet.gameObject.destroy();
        }
        this.bullets.splice(i, 1);
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
        
        // Destroy bullet
        bullet.gameObject.destroy();
        this.bullets.splice(i, 1);
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
  
  showRange() {
    // Make sure range is set properly
    this.rangeCircle.setRadius(this.range);
    this.rangeCircle.setVisible(true);
    console.log(`Showing range circle for ${this.type} with radius ${this.range}`);
  }
  
  hideRange() {
    this.rangeCircle.setVisible(false);
  }
  
  canUpgrade() {
    return this.level < this.maxLevel;
  }
  
  upgrade() {
    if (!this.canUpgrade()) return false;
    
    if (this.scene.game.spendMoney(this.upgradeCost)) {
      this.level++;
      this.updateStats();
      
      // Update range circle
      this.rangeCircle.setRadius(this.range);
      
      return true;
    }
    
    return false;
  }
  
  // Implemented by child classes
  updateStats() {
    // Should be overridden
  }
  
  destroy() {
    // Clean up bullets
    for (const bullet of this.bullets) {
      if (bullet.gameObject) {
        bullet.gameObject.destroy();
      }
    }
    
    // Remove game objects
    this.gameObject.destroy();
    this.towerBase.destroy();
    this.rangeCircle.destroy();
  }
}

export class Cannon extends Tower {
  constructor(scene, options) {
    super(scene, options);
    
    // Set initial stats
    this.buyCost = 20;
    this.bulletType = 'bullet_cannon';
    this.updateStats();
    
    // Update range circle with the correct range
    this.rangeCircle.setRadius(this.range);
    console.log("Cannon created with range:", this.range, "and bulletType:", this.bulletType);
  }
  
  updateStats() {
    // Stats based on level
    switch(this.level) {
      case 1:
        this.sellCost = 10;
        this.upgradeCost = 30;
        this.damage = 20;
        this.fireRate = 3000;
        this.range = 3 * this.scene.CELL_SIZE;
        break;
      case 2:
        this.sellCost = 25;
        this.upgradeCost = 50;
        this.damage = 30;
        this.fireRate = 2500;
        this.range = 3 * this.scene.CELL_SIZE;
        break;
      case 3:
        this.sellCost = 35;
        this.upgradeCost = null; // Max level
        this.damage = 40;
        this.fireRate = 2000;
        this.range = 4 * this.scene.CELL_SIZE;
        break;
    }
  }
}

export class MG extends Tower {
  constructor(scene, options) {
    super(scene, options);
    
    // Set initial stats
    this.buyCost = 40;
    this.bulletType = 'bullet_mg';
    this.updateStats();
    
    // Update range circle with the correct range
    this.rangeCircle.setRadius(this.range);
    console.log("MG created with range:", this.range, "and bulletType:", this.bulletType);
  }
  
  updateStats() {
    // Stats based on level
    switch(this.level) {
      case 1:
        this.sellCost = 20;
        this.upgradeCost = 40;
        this.damage = 30;
        this.fireRate = 3000;
        this.range = 3 * this.scene.CELL_SIZE;
        break;
      case 2:
        this.sellCost = 25;
        this.upgradeCost = 60;
        this.damage = 40;
        this.fireRate = 2500;
        this.range = 4 * this.scene.CELL_SIZE;
        break;
      case 3:
        this.sellCost = 35;
        this.upgradeCost = null; // Max level
        this.damage = 50;
        this.fireRate = 2000;
        this.range = 5 * this.scene.CELL_SIZE;
        break;
    }
  }
}

export class MissileLauncher extends Tower {
  constructor(scene, options) {
    // Print available textures before creating the tower
    console.log("Available scene textures before MissileLauncher creation:", 
                Object.keys(scene.textures.list));
    
    // Log the options to debug
    console.log("MissileLauncher options:", JSON.stringify(options));
    
    super(scene, options);
    
    // Set initial stats
    this.buyCost = 60;
    this.bulletType = 'missile';
    this.updateStats();
    
    // Update range circle with the correct range
    this.rangeCircle.setRadius(this.range);
    
    console.log("MissileLauncher created with range:", this.range, 
                "bulletType:", this.bulletType,
                "position:", this.position, 
                "type:", this.type);
    
    // Validate that the missile texture exists
    if (!scene.textures.exists('missile')) {
      console.error("WARNING: 'missile' texture does not exist! Available textures:", 
                    Object.keys(scene.textures.list));
    }
  }
  
  updateStats() {
    // Stats based on level
    switch(this.level) {
      case 1:
        this.sellCost = 30;
        this.upgradeCost = 50;
        this.damage = 40;
        this.fireRate = 3000;
        this.range = 4 * this.scene.CELL_SIZE;
        break;
      case 2:
        this.sellCost = 25;
        this.upgradeCost = 70;
        this.damage = 50;
        this.fireRate = 2500;
        this.range = 5 * this.scene.CELL_SIZE;
        break;
      case 3:
        this.sellCost = 35;
        this.upgradeCost = null; // Max level
        this.damage = 60;
        this.fireRate = 2000;
        this.range = 6 * this.scene.CELL_SIZE;
        break;
    }
  }
  
  // Override fire method specifically for MissileLauncher to ensure it works
  fire(monster, time) {
    if (!monster) return;
    
    const timeSinceLastFire = time - this.lastFired;
    
    // Calculate angle to monster
    const dx = monster.gameObject.x - this.gameObject.x;
    const dy = monster.gameObject.y - this.gameObject.y;
    const angle = Math.atan2(dy, dx);
    
    // Rotate tower to face monster with a +90 degree correction
    this.gameObject.rotation = angle + Math.PI/2;
    
    // Check if tower can fire again based on fire rate
    if (timeSinceLastFire >= this.fireRate) {
      this.lastFired = time;
      
      console.log("MissileLauncher firing at monster:", monster);
      
      // Create bullet
      const cellSize = this.scene.getCellSize();
      const bulletScale = cellSize / 600; // Slightly larger for missiles
      
      // Verify the texture exists again
      if (!this.scene.textures.exists(this.bulletType)) {
        console.error(`MissileLauncher: Missing texture: ${this.bulletType}`);
        return;
      }
      
      const bullet = this.scene.add.image(
        this.gameObject.x,
        this.gameObject.y,
        this.bulletType
      ).setScale(bulletScale).setDepth(5);
      
      console.log("Created missile bullet:", bullet);
      
      // Store bullet data
      const bulletData = {
        gameObject: bullet,
        targetMonster: monster,
        speed: 400, // Slightly slower for missiles
        damage: this.damage,
        active: true
      };
      
      this.bullets.push(bulletData);
    }
  }
}
