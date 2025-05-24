export default class CombatManager {
  constructor(scene) {
    this.scene = scene;
    this.lastTowerLogTime = 0;
  }
  
  isMonsterInRange(tower, monster) {
    if (!tower || !monster || !tower.gameObject || !monster.gameObject) return false;
    
    const dx = tower.gameObject.x - monster.gameObject.x;
    const dy = tower.gameObject.y - monster.gameObject.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= tower.range;
  }
  
  findTarget(tower, monsters) {
    let closestMonster = null;
    let closestDistance = Infinity;
    
    for (const monster of monsters) {
      // Skip invalid monsters
      if (!monster || !monster.gameObject) continue;
      
      // Handle both Monster class and direct monster objects
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
    
    return closestMonster;
  }
  
  fireTower(tower, monster, time) {
    if (!tower || !monster) return;
    
    const timeSinceLastFire = time - tower.lastFired;
    
    // Calculate angle to monster
    const dx = monster.gameObject.x - tower.gameObject.x;
    const dy = monster.gameObject.y - tower.gameObject.y;
    const angle = Math.atan2(dy, dx);
    
    // Rotate tower to face monster with a +90 degree correction
    tower.gameObject.rotation = angle + Math.PI/2;
    
    // Check if tower can fire again based on fire rate
    if (timeSinceLastFire >= tower.fireRate) {
      tower.lastFired = time;
      
      // Create bullet
      const width = this.scene.cameras.main.width;
      const height = this.scene.cameras.main.height;
      const adjustedWidth = width - 200;
      const adjustedHeight = height - 200;
      const cellSize = adjustedWidth <= adjustedHeight ? adjustedWidth / this.scene.GRID_COLS : adjustedHeight / this.scene.GRID_ROWS;
      
      const bulletScale = cellSize / 700; // Adjust based on your bullet image size
      
      const bullet = this.scene.add.image(
        tower.gameObject.x,
        tower.gameObject.y,
        'bullet_cannon'
      ).setScale(bulletScale).setDepth(15);
      
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
  
  updateBullets(delta) {
    // Update all tower bullets
    for (let row = 0; row < this.scene.GRID_ROWS; row++) {
      for (let col = 0; col < this.scene.GRID_COLS; col++) {
        const tower = this.scene.grid[row] && this.scene.grid[row][col];
        
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
              // Check if the monster has takeDamage method
              if (typeof bullet.targetMonster.takeDamage === 'function') {
                // Use the proper method if available
                bullet.targetMonster.takeDamage(bullet.damage);
              } else {
                // Fallback: directly update the monster's HP
                bullet.targetMonster.hp -= bullet.damage;
                
                // Fallback: manually update HP bar if it exists
                if (bullet.targetMonster.hpBar && bullet.targetMonster.hpBarBg) {
                  const hpRatio = Math.max(0, bullet.targetMonster.hp / bullet.targetMonster.maxHp);
                  bullet.targetMonster.hpBar.width = bullet.targetMonster.hpBarBg.width * hpRatio;
                  
                  // Change HP bar color based on health
                  if (hpRatio < 0.3) {
                    bullet.targetMonster.hpBar.fillColor = 0xff0000; // Red when low health
                  } else if (hpRatio < 0.6) {
                    bullet.targetMonster.hpBar.fillColor = 0xffff00; // Yellow when medium health
                  }
                }
                
                // Fallback: update HP text if it exists
                if (bullet.targetMonster.hpText) {
                  bullet.targetMonster.hpText.setText(`${Math.ceil(bullet.targetMonster.hp)}/${bullet.targetMonster.maxHp}`);
                }
              }
              
              // Check if monster died
              if (bullet.targetMonster.hp <= 0) {
                // Notify game manager of kill for score/money
                this.scene.game.monsterKilled();
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
  
  updateCombat(time, delta) {
    // Skip if game is not running
    if (!this.scene.isGameRunning) return;
    
    // Get monsters from the monster manager
    const monsters = this.scene.monsterManager ? this.scene.monsterManager.monsters : [];
    
    // Early exit if no monsters
    if (!monsters || monsters.length === 0) return;
    
    // Update all towers
    for (let row = 0; row < this.scene.GRID_ROWS; row++) {
      for (let col = 0; col < this.scene.GRID_COLS; col++) {
        const tower = this.scene.grid[row] && this.scene.grid[row][col];
        
        if (tower) {
          // Log tower information periodically
          if (Math.floor(time/10000) % 3 === 0 && Math.floor(time/10000) !== this.lastTowerLogTime) {
            this.lastTowerLogTime = Math.floor(time/10000);
            console.log(`Tower at [${row},${col}]: type=${tower.type}, range=${tower.range}, level=${tower.level}`);
          }
          
          // Find target for this tower
          const target = tower.findTarget(monsters);
          
          // Fire at target if found
          if (target) {
            tower.fire(target, time);
          }
          
          // Update bullets
          tower.updateBullets(delta);
        }
      }
    }
  }
}
