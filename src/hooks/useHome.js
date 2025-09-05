import { useEffect, useMemo, useState } from 'react';
import { listProducts } from '../services/products';
import { mapProductToCard } from '../utils/productMapper';
import useCategories from './useCategories';

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
  const { categories: apiCategories, slugify } = useCategories();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('all');
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [apiParams, setApiParams] = useState({});

  const load = async () => {
    const params = { page: 1, limit: 20, count: true, ...(apiParams || {}) };
    try { console.log('[useHome] fetching products with params', params); } catch {}
    const data = await listProducts(params);
    const list = (data?.result || []).map((p) => {
      const mapped = mapProductToCard(p);
      // derive a slug from product category to match chips
      const slug = p?.category ? slugify(p.category) : normCategory(p?.category);
      return { ...mapped, category: slug };
    });
    try { console.log('[useHome] products fetch result', { total: list.length, meta: data?.meta }); } catch {}
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

  // Apply server-side filters and fetch
  const applyFilters = async (params = {}) => {
    try { console.log('[useHome] applyFilters with', params); } catch {}
    setApiParams(params || {});
    setRefreshing(true);
    try {
      const list = await load();
      setItems(list);
    } catch (e) {
      setError(e?.message || 'Failed to fetch filtered products');
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
    categories: apiCategories,
    items: filtered,
    loaded,
    error,
    refreshing,
    refresh,
    applyFilters,
    apiParams,
  };
}
