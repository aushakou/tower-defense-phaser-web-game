export default class Tower {
  constructor(scene, options) {
    this.scene = scene;
    this.position = { row: options.row, col: options.col };
    this.type = options.type;
    this.cost = options.cost;
    this.range = options.range;
    this.damage = options.damage || 20;
    this.fireRate = options.fireRate || 3000; // fire every 3 seconds (in ms)
    this.level = options.level || 1;
    this.upgradeCost = options.upgradeCost || 50;
    this.lastFired = 0;
    this.bullets = [];
    
    // Create tower sprite
    this.gameObject = scene.add.image(
      options.x,
      options.y,
      options.imageKey
    ).setScale(options.scale)
     .setInteractive();
    
    // Create range circle (initially hidden)
    this.rangeCircle = scene.add.circle(
      options.x,
      options.y,
      this.range,
      0x00ff00,
      0.2
    ).setDepth(1).setVisible(false);
    
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
      
      const bullet = this.scene.add.image(
        this.gameObject.x,
        this.gameObject.y,
        'bullet_cannon'
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
  
  upgrade() {
    if (this.scene.money >= this.upgradeCost) {
      // Deduct money
      this.scene.money -= this.upgradeCost;
      this.scene.moneyText.setText(`Money: $${this.scene.money}`);
      
      // Upgrade stats
      this.level++;
      this.damage += 10; // Increase damage by 10 per level
      this.fireRate *= 0.8; // Reduce fire rate by 20% (fire faster)
      this.range *= 1.2; // Increase range by 20%
      this.upgradeCost = Math.floor(this.upgradeCost * 1.5); // Increase upgrade cost
      
      // Update range circle
      this.rangeCircle.setRadius(this.range);
      
      return true;
    }
    
    return false;
  }
  
  showRange() {
    this.rangeCircle.setVisible(true);
  }
  
  hideRange() {
    this.rangeCircle.setVisible(false);
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
        bullet.targetMonster.takeDamage(bullet.damage);
        
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
  
  destroy() {
    // Clean up bullets
    for (const bullet of this.bullets) {
      if (bullet.gameObject) {
        bullet.gameObject.destroy();
      }
    }
    
    // Remove game objects
    this.gameObject.destroy();
    this.rangeCircle.destroy();
  }
}
