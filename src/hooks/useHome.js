import { useEffect, useMemo, useState } from 'react';
import { listProducts } from '../services/products';
import { mapProductToCard } from '../utils/productMapper';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'home', label: 'Home' },
];

// Local mapping from API category to chip ids (lowercase)
function normCategory(cat) {
  if (!cat) return 'home';
  const c = String(cat).toLowerCase();
  if (c.includes('elect')) return 'electronics';
  if (c.includes('game')) return 'gaming';
  if (c.includes('fash')) return 'fashion';
  return c;
}

export default function useHome() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('all');
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await listProducts({ page: 1, limit: 20, count: true });
    const list = (data?.result || []).map((p) => {
      const mapped = mapProductToCard(p);
      // add a normalized category used for filtering chips
      return { ...mapped, category: normCategory(p?.category) };
    });
    return list;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await load();
        if (alive) setItems(list);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to fetch products');
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const list = await load();
      setItems(list);
    } catch (e) {
      setError(e?.message || 'Failed to fetch products');
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) =>
      (selected === 'all' || it.category === selected) &&
      (!q || it.title.toLowerCase().includes(q))
    );
  }, [query, selected, items]);

  return {
    query,
    setQuery,
    selected,
    setSelected,
    categories: CATEGORIES,
    items: filtered,
    loaded,
    error,
    refreshing,
    refresh,
  };
}
