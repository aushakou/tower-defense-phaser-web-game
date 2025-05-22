import { useRef, useEffect } from 'react';
import Phaser from 'phaser';
import configFactory from './config';

export default function GamePage() {
  const gameRef = useRef(null);
  const gameInstanceRef = useRef(null);

  useEffect(() => {
    if (!gameRef.current || gameInstanceRef.current) return;

    const config = configFactory(gameRef.current);
    gameInstanceRef.current = new Phaser.Game(config);

    return () => {
      gameInstanceRef.current?.destroy(true);
      gameInstanceRef.current = null;
    };
  }, []);

  return (
    <div>
      <h1 style={{ color: 'white' }}>🎮 Phaser Game</h1>
      <div ref={gameRef} />
    </div>
  );
}
