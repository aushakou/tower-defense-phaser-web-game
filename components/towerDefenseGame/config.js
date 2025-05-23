import MainScreen from './screens/MainScreen';

const config = (parentRef) => ({
  type: Phaser.AUTO,
  width: parentRef.clientWidth,
  height: parentRef.clientHeight,
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
