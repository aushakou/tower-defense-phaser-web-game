export default class MainScreen extends Phaser.Scene {
    constructor() {
      super('MainScreen');
    }
  
    preload() {
      this.load.image('logo', '/logo.png');
    }
  
    create() {
      this.logo = this.physics.add.image(400, 100, 'logo');
      this.logo.setVelocity(150, 150);
      this.logo.setBounce(1, 1);
      this.logo.setCollideWorldBounds(true);
    }
  
    update() {
      // Game logic goes here
    }
  }
  