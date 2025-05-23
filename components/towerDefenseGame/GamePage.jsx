import { useRef, useEffect, useState } from 'react';
import Phaser from 'phaser';
import configFactory from './config';
import { useRouter } from 'next/router';

export default function GamePage() {
  const router = useRouter();
  const gameRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!gameRef.current) return;

    const observer = new ResizeObserver(() => {
      const el = gameRef.current;
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setIsReady(true);
        observer.disconnect(); // stop watching once ready
      }
    });

    observer.observe(gameRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isReady || !gameRef.current || gameInstanceRef.current) return;

    const config = configFactory(gameRef.current);
    gameInstanceRef.current = new Phaser.Game(config);

    return () => {
      gameInstanceRef.current?.destroy(true);
      gameInstanceRef.current = null;
    };
  }, [isReady]);

  return (
    <>
      <div className="sticky top-0 z-20 bg-gray-200 dark:bg-neutral-900 shadow-md overscroll-none flex-shrink-0">
          <nav className="px-4 py-2 flex items-center min-h-[56px]">
            <div className="flex w-1/2 justify-start items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">🏰 Tower Defense Game</h1>
              <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-3 py-1 ml-8 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
                >
                  🏠 Home
              </button>
            </div>
            <div className="flex w-1/2 justify-end items-center">
              <button
                  type="button"
                  className="px-3 py-1 mr-8 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
                >
                  Login
              </button>
            </div>
          </nav>
        </div>
      
      <div ref={gameRef} id="phaser-game-container" className="w-full h-full bg-black"/>
    </>
  );
}
