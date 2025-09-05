// Map backend Product to Home card item shape and details item

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x600?text=%7Bimage%7D';
const PLACEHOLDER_ICON = 'https://via.placeholder.com/64?text=%7Bicon%7D';

export function mapProductToCard(p) {
  const t = p?.tournament || null;
  const game = p?.game || null;
  const images = Array.isArray(p?.images) && p.images.length ? p.images : [];
  return {
    // required by lists and favorites
    id: String(p?._id || ''),
    // UI text fields with fallbacks
    title: p?.name || '{text}',
    image: images[0] || game?.thumbnail || PLACEHOLDER_IMAGE,
    images,
    // Progress-related numbers (use numeric defaults to keep UI stable)
    playsCompleted: Number(t?.numberOfPlayers || 0),
    playsTotal: Number(t?.expectedPlayers || t?.totalSeats || 0),
    // Ends in: backend field is `endedAt` (string ISO). Keep ISO; UI can parse.
    endedAt: t?.endedAt || null,
    // Tournament status to drive UI states (e.g., OVER/UNFILLED => ended)
    tournamentStatus: t?.status || null,
    // Game info
    gameType: game?.name || '{text}',
    gameTypeIcon: game?.thumbnail || PLACEHOLDER_ICON,
    // Per play fee comes from tournament.entryFee (Zish coin). Use placeholder if missing.
    coinPerPlay: (t && t.entryFee !== undefined && t.entryFee !== null) ? Number(t.entryFee) : '{price}',
    // Keep raw for details if needed
    raw: p,
  };
}

export function mapProductToDetails(p) {
  const base = mapProductToCard(p);
  return {
    ...base,
    // additional fields commonly used in details
    price: p?.price,
    name: p?.name,
    description: p?.description,
    category: p?.category,
    ownerVerified: p?.ownerVerified,
    ownerUsername: p?.ownerUsername,
    user: typeof p?.user === 'string' ? p.user : p?.user?._id || p?.user,
    game: p?.game || null,
    tournament: p?.tournament || null,
    leaderboard: p?.leaderboard || null,
    fulfillment: p?.fulfillment || null,
    createdAt: p?.createdAt,
    updatedAt: p?.updatedAt,
  };
}

export default { mapProductToCard, mapProductToDetails };
