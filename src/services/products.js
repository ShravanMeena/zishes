import axios from 'axios';
import { attachAuthInterceptors } from './http';
import { API_BASE } from '../config/api';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 15000 }));

async function request(path, { method = 'GET', params, data, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      data,
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = data?.message || data?.error || err?.message || 'Request failed';
    const e = new Error(message);
    e.status = status;
    e.data = data;
    throw e;
  }
}

// Maps UI sort keywords to API `sort` values
function mapSort(sort) {
  if (!sort) return undefined;
  const s = String(sort).toLowerCase();
  if (s === 'popular') return 'popular';
  if (s === 'latest' || s === 'newest') return 'newest';
  if (s === 'oldest') return 'oldest';
  if (s === 'ending' || s === 'ending_soon') return 'ending';
  // UI-specific options not supported by API fall back to newest
  if (s === 'price_low' || s === 'price_high') return 'newest';
  return undefined;
}

// Accepts full filter set per API spec. Single-value ranges are mirrored to min/max.
// Supported options:
// - page, limit, count
// - user, category, categories (string[] or comma-separated string)
// - condition ('New' | 'LIKE_NEW' | 'GOOD' | 'FAIR')
// - tournamentStatus ('OPEN' | 'IN_PROGRESS' | 'OVER' | 'UNFILLED')
// - sort ('newest' | 'oldest' | 'popular' | 'ending') or UI aliases
// - entryFee or entryFeeMin/entryFeeMax
// - players or playersMin/playersMax
// - progress or progressMin/progressMax
// - createdAt or createdFrom/createdTo (ISO)
// - endsOn or endsAfter/endsBefore (ISO)
export async function listProducts(opts = {}) {
  const {
    page = 1,
    limit = 20,
    count = false,
    user,
    category,
    categories,
    condition,
    tournamentStatus,
    sort,
    // numeric ranges / single values
    entryFee,
    entryFeeMin,
    entryFeeMax,
    players,
    playersMin,
    playersMax,
    progress,
    progressMin,
    progressMax,
    // date ranges / single values (ISO)
    createdAt,
    createdFrom,
    createdTo,
    endsOn,
    endsAfter,
    endsBefore,
  } = opts || {};

  const params = {};
  // Paging
  params.page = page;
  params.limit = limit;
  if (count) params.count = 'true';

  // Simple filters
  if (user) params.user = user;
  if (category && String(category).toLowerCase() !== 'all') params.category = category;
  if (categories) {
    if (Array.isArray(categories)) {
      const list = categories.filter(Boolean).map(String);
      if (list.length) params.categories = list.join(',');
    } else if (typeof categories === 'string') {
      params.categories = categories;
    }
  }
  if (condition) params.condition = condition; // pass through exact enum from caller
  if (tournamentStatus) params.tournamentStatus = tournamentStatus;
  const apiSort = mapSort(sort);
  if (apiSort) params.sort = apiSort;

  // Numeric range helpers (mirror when single provided)
  const efMin = entryFeeMin ?? entryFee;
  const efMax = entryFeeMax ?? entryFee;
  if (efMin != null) params.entryFeeMin = Number(efMin);
  if (efMax != null) params.entryFeeMax = Number(efMax);

  const plMin = playersMin ?? players;
  const plMax = playersMax ?? players;
  if (plMin != null) params.playersMin = Number(plMin);
  if (plMax != null) params.playersMax = Number(plMax);

  const prMin = progressMin ?? progress;
  const prMax = progressMax ?? progress;
  if (prMin != null) params.progressMin = Number(prMin);
  if (prMax != null) params.progressMax = Number(prMax);

  // Date ranges (ISO) — mirror when single provided
  const cFrom = createdFrom ?? createdAt;
  const cTo = createdTo ?? createdAt;
  if (cFrom) params.createdFrom = new Date(cFrom).toISOString();
  if (cTo) params.createdTo = new Date(cTo).toISOString();

  const eAfter = endsAfter ?? endsOn;
  const eBefore = endsBefore ?? endsOn;
  if (eAfter) params.endsAfter = new Date(eAfter).toISOString();
  if (eBefore) params.endsBefore = new Date(eBefore).toISOString();

  // Request
  const data = await request('/products', { params });
  if (Array.isArray(data)) return { result: data, meta: { page, limit } };
  return data || { result: [], meta: { page, limit } };
}

// Helper: map FiltersSheet selections to API params
// filters: { price, plays, progress, timeLeft, condition, category, sortBy }
export function buildProductQueryFromUI(filters = {}) {
  const out = {};
  const { price, plays, progress, timeLeft, condition, category, sortBy } = filters;

  // Category (single)
  if (category && String(category).toLowerCase() !== 'all') out.category = category;

  // Condition mapping UI -> API enums
  if (condition) {
    const c = String(condition).toLowerCase();
    if (c === 'new') out.condition = 'New';
    else if (c === 'likenew' || c === 'like_new' || c === 'like-new') out.condition = 'LIKE_NEW';
    else if (c === 'used' || c === 'good') out.condition = 'GOOD';
    else if (c === 'fair') out.condition = 'FAIR';
  }

  // Single-value ranges mirrored
  if (price != null) { out.entryFeeMin = Number(price); out.entryFeeMax = Number(price); }
  if (plays != null) { out.playersMin = Number(plays); out.playersMax = Number(plays); }
  if (progress != null) { out.progressMin = Number(progress); out.progressMax = Number(progress); }

  // Time left presets -> tournament end window
  if (timeLeft) {
    const now = new Date();
    const startIso = now.toISOString();
    const t = String(timeLeft).toLowerCase();
    let end = new Date(now);
    if (t === 'today') {
      end.setHours(23,59,59,999);
    } else if (t === 'week') {
      const d = end.getDay();
      const diff = 6 - d; // days to Saturday (assuming week ends Sat)
      end.setDate(end.getDate() + diff);
      end.setHours(23,59,59,999);
    } else if (t === 'month') {
      end = new Date(end.getFullYear(), end.getMonth()+1, 0, 23, 59, 59, 999);
    }
    out.endsAfter = startIso;
    out.endsBefore = end.toISOString();
  }

  // Sort mapping
  const s = mapSort(sortBy);
  if (s) out.sort = s;

  return out;
}

export async function getProductById(id, token) {
  if (!id) throw new Error('Missing product id');
  // Auth required
  const data = await request(`/products/${id}`, { token });
  return data;
}

// Create Product + Tournament per backend spec
export async function createProductWithTournament(body, token) {
  if (!token) throw new Error('Unauthorized');
  if (!body || typeof body !== 'object') throw new Error('Invalid payload');
  const data = await request('/products', { method: 'POST', data: body, token });
  return data;
}

// Auth: Get my products/listings for the authenticated seller
export async function getMyProducts(token) {
  if (!token) throw new Error('Unauthorized');
  const data = await request('/products/my-products', { token });
  return Array.isArray(data?.data) ? data?.data : (data?.data || []);
}

// Update product (partial). Fields allowed depend on server rules.
export async function updateProduct(id, patch, token) {
  if (!token) throw new Error('Unauthorized');
  if (!id) throw new Error('Missing product id');
  if (!patch || typeof patch !== 'object') throw new Error('Invalid patch');
  const data = await request(`/products/${id}`, { method: 'PATCH', data: patch, token });
  return data;
}

export default { listProducts, getProductById, buildProductQueryFromUI, createProductWithTournament, getMyProducts, updateProduct };
