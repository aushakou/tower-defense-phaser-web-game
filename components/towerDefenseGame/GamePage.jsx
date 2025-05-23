import { useRef, useEffect } from 'react';
import Phaser from 'phaser';
import configFactory from './config';
import Layout from '../Layout';
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
    <Layout>
      <div>
        <h1>🏰 Tower Defense Game</h1>
        <div ref={gameRef} />
      </div>
    </Layout>
  );
}
