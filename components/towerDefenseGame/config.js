import MainScreen from './screens/MainScreen';

const config = (parentRef) => ({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: parentRef,
  backgroundColor: '#1d1d1d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: MainScreen,
});

export default config;
