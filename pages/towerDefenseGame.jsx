import dynamic from 'next/dynamic';

const TowerDefenseGamePage = dynamic(() => import('../components/towerDefenseGame/GamePage'), {
  ssr: false,
});

export default TowerDefenseGamePage;
