import { useEffect, useState } from 'react';
import { listCategories } from '../services/categories';

function slugify(name) {
  if (!name) return 'all';
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function useCategories() {
  const [categories, setCategories] = useState([{ id: 'all', label: 'All', rawId: null }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError(null);
        const data = await listCategories();
        const mapped = Array.isArray(data)
          ? data.map((c) => ({
              id: slugify(c?.name || c?._id),
              label: c?.name || 'Category',
              rawId: c?._id || c?.id || c?.code || c?.slug || null,
            }))
          : [];
        if (alive) setCategories([{ id: 'all', label: 'All', rawId: null }, ...mapped]);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to fetch categories');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { categories, loading, error, slugify };
}
