import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-4 m-4">
      <h1>Tower Defense Game</h1>
      <nav className="p-4 m-4">
        <ul>
          <li><Link href="/towerDefenseGame">🎮 Play Tower Defense Game</Link></li>
          <li>🏆 Scoreboard</li>
        </ul>
      </nav>
    </main>
  );
}
