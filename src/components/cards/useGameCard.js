import { useCallback, useEffect, useMemo, useState } from 'react';

export default function useGameCard(item) {
  const [faved, setFaved] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const progress = useMemo(() => {
    if (!item?.playsTotal) return 0;
    return Math.min(1, (item.playsCompleted || 0) / item.playsTotal);
  }, [item]);

  const msLeft = Math.max(0, (item?.endsAt || Date.now()) - now);
  const endsIn = formatDuration(msLeft);

  const toggleFav = useCallback(() => setFaved(v => !v), []);

  const [loading, setLoading] = useState(false);
  const handlePlay = useCallback(async (onPress) => {
    setLoading(true);
    try {
      const result = onPress?.();
      if (result && typeof result.then === 'function') {
        await result;
      } else {
        // ensure quick visual feedback even if navigate is sync
        await new Promise(r => setTimeout(r, 650));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { faved, toggleFav, progress, endsIn, loading, handlePlay };
}

function formatDuration(ms){
  const sec = Math.floor(ms/1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
}
