export default class PathManager {
  constructor(scene) {
    this.scene = scene;
    this.paths = {};
  }
  
  findPath(start, end) {
    // Create a cache key for this path
    const pathKey = `${start.row},${start.col}_${end.row},${end.col}`;
    
    // Return cached path if available
    if (this.paths[pathKey]) {
      return this.paths[pathKey];
    }
    
    // Generate new path
    const path = this.calculatePath(start, end);
    
    // Cache the path for future use
    this.paths[pathKey] = path;
    
    return path;
  }
  
  calculatePath(start, end) {
    // Simplified pathfinding with Dijkstra's algorithm
    // First, create graph representation
    const graph = {};
    
    // Create a key for each node
    const getNodeKey = (row, col) => `${row},${col}`;
    
    // Initialize graph with all valid cells
    for (let row = 0; row < this.scene.GRID_ROWS; row++) {
      for (let col = 0; col < this.scene.GRID_COLS; col++) {
        const nodeKey = getNodeKey(row, col);
        graph[nodeKey] = {};
        
        // Check if cell is blocked (has a tower)
        const cell = this.scene.grid[row] && this.scene.grid[row][col];
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
            if (adjacent.row >= 0 && adjacent.row < this.scene.GRID_ROWS && 
                adjacent.col >= 0 && adjacent.col < this.scene.GRID_COLS) {
              const adjKey = getNodeKey(adjacent.row, adjacent.col);
              const adjCell = this.scene.grid[adjacent.row] && this.scene.grid[adjacent.row][adjacent.col];
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
  
  // Recalculate all paths (call when grid changes, e.g., when placing a tower)
  recalculatePaths() {
    this.paths = {};
  }
  
  updateMonsterPosition(monster, delta) {
    if (!monster || monster.currentPathIndex >= monster.path.length - 1) return;
    
    // Use the constant cell size
    const cellSize = this.scene.CELL_SIZE;
    
    // Calculate time-based movement
    const timeElapsed = delta / 10;
    const distanceToMove = monster.speed * timeElapsed;
    
    // Current and next position in the path
    const current = monster.path[monster.currentPathIndex];
    const next = monster.path[monster.currentPathIndex + 1];
    
    // Calculate grid positions
    const currentX = this.scene.gridOffsetX + current.col * cellSize + cellSize / 2;
    const currentY = this.scene.gridOffsetY + current.row * cellSize + cellSize / 2;
    const nextX = this.scene.gridOffsetX + next.col * cellSize + cellSize / 2;
    const nextY = this.scene.gridOffsetY + next.row * cellSize + cellSize / 2;
    
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
        monster.reachedEnd = true;
        this.scene.monsterReachedEnd(monster);
      }
    }
  }
} 