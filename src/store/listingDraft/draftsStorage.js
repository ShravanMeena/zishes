import AsyncStorage from '@react-native-async-storage/async-storage';

const LIST_KEY = 'listing_drafts_v1';

export async function getAllDrafts() {
  try {
    const json = await AsyncStorage.getItem(LIST_KEY);
    if (!json) return [];
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];

    // Ensure the list is unique by draft name (case-insensitive),
    // keeping the most recent entry for each name.
    const norm = (s) => String(s || '').trim().toLowerCase();
    const sorted = [...arr].sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    const seen = new Set();
    const unique = [];
    for (const it of sorted) {
      const key = norm(it?.name);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(it);
    }

    // Persist back if we removed duplicates
    if (unique.length !== arr.length) {
      try { await AsyncStorage.setItem(LIST_KEY, JSON.stringify(unique)); } catch (_) {}
    }

    return unique;
  } catch (_) {
    return [];
  }
}

export async function saveNewDraft({ name, data, originCountry }) {
  const now = Date.now();
  const draftName = (name || 'Untitled Item').trim();
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const country = String(originCountry || '').trim();
  const item = { id, name: draftName, createdAt: now, originCountry: country || null, data };
  const list = await getAllDrafts();

  // Enforce uniqueness by item name (case-insensitive, trimmed)
  const norm = (s) => String(s || '').trim().toLowerCase();
  const idx = list.findIndex((d) => norm(d.name) === norm(draftName));

  if (idx >= 0) {
    // Remove old entry and add the new one to the top (most recent first)
    list.splice(idx, 1);
  }

  list.unshift(item);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(list));
  return item;
}

export async function deleteDraft(id) {
  const list = await getAllDrafts();
  const filtered = list.filter((d) => d.id !== id);
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(filtered));
  return true;
}

export async function clearAllDrafts() {
  await AsyncStorage.removeItem(LIST_KEY);
}

export async function getDraftById(id) {
  const list = await getAllDrafts();
  return list.find((d) => d.id === id) || null;
}
