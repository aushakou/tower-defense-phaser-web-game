// components/Layout.jsx
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="w-full h-full mx-auto p-8 bg-neutral-900 overflow-y-auto overscroll-contain scrollbar-hide">
      <nav className="flex text-gray-100">
        <Link href="/">🏠 Home</Link> | <Link href="/towerDefenseGame">🎮 Tower Defense Game</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
