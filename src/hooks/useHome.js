import { useMemo, useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'home', label: 'Home' },
];

const ITEMS = [
  {
    id: '1',
    title: 'Pro Gamer Headset',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1612198185731-e4b093b84b61?q=80&w=1200&auto=format&fit=crop',
    coinPerPlay: 20,
    playsCompleted: 150,
    playsTotal: 200,
    endsAt: Date.now() + 1 * 24 * 3600 * 1000 + 30 * 3600 * 1000,
    gameType: 'Word',
    gameTypeIcon: 'https://i.imgur.com/2yaf2wb.png',
  },
  {
    id: '2',
    title: 'Luxury Smartwatch',
    category: 'fashion',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop',
    coinPerPlay: 20,
    playsCompleted: 150,
    playsTotal: 200,
    endsAt: Date.now() + 1 * 24 * 3600 * 1000 + 30 * 3600 * 1000,
    gameType: 'Word',
    gameTypeIcon: 'https://i.imgur.com/2yaf2wb.png',
    badge: 'Early Termination Opted',
  },
  {
    id: '3',
    title: 'Bluetooth Speaker',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop',
    coinPerPlay: 10,
    playsCompleted: 60,
    playsTotal: 100,
    endsAt: Date.now() + 2 * 24 * 3600 * 1000 + 2 * 3600 * 1000,
    gameType: 'Puzzle',
    gameTypeIcon: 'https://i.imgur.com/2yaf2wb.png',
  },
];

export default function useHome() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((it) =>
      (selected === 'all' || it.category === selected) &&
      (!q || it.title.toLowerCase().includes(q))
    );
  }, [query, selected]);

  return {
    query,
    setQuery,
    selected,
    setSelected,
    categories: CATEGORIES,
    items: filtered,
  };
}

