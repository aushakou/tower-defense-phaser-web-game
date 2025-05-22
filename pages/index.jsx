import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Tower Defense Game</h1>
      <nav style={{ marginTop: "2rem" }}>
        <ul>
          <li><Link href="/towerDefenseGame">🎮 Play Tower Defense Game</Link></li>
          <li>🏆 Scoreboard</li>
        </ul>
      </nav>
    </main>
  );
}
