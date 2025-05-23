export default class MainScreen extends Phaser.Scene {
  constructor() {
    super('MainScreen');
  }

  preload() {
    this.load.image('background', '/sand_background.png');
  }

  create() {
    this.background = this.add.image(0, 0, 'background');
    this.background.setOrigin(0, 0);
    this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
  }

  update() {
    // Game logic goes here
  }
}
