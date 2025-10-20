import { APP_SCHEME, APP_HOST, WEB_ORIGIN } from '../config/links';

/**
 * Normalize an origin string (scheme + host) so we can compare safely.
 */
function normalizeOrigin(origin) {
  if (!origin) return '';
  // Drop trailing slash and force lowercase for comparisons
  return String(origin).trim().replace(/\/+$/, '').toLowerCase();
}

function normalizeHost(host) {
  if (!host) return '';
  return String(host).trim().toLowerCase().replace(/^www\./, '');
}

const NORMALIZED_APP_SCHEME = String(APP_SCHEME || '').trim().toLowerCase();
const NORMALIZED_APP_HOST = String(APP_HOST || '').trim().toLowerCase();
const NORMALIZED_WEB_ORIGIN = normalizeOrigin(WEB_ORIGIN);
let NORMALIZED_WEB_HOST = '';
try {
  NORMALIZED_WEB_HOST = normalizeHost(new URL(WEB_ORIGIN).host);
} catch (_err) {
  NORMALIZED_WEB_HOST = normalizeHost(WEB_ORIGIN);
}

/**
 * Lightweight parser for scheme based URLs so we do not depend on the
 * WHATWG URL implementation (which is incomplete in React Native).
 */
function parseUrlComponents(raw) {
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+\-.]*):\/\//i);
  if (!schemeMatch) return null;

  const scheme = schemeMatch[1].toLowerCase();
  const remainder = trimmed.slice(schemeMatch[0].length);
  const authorityEnd = remainder.search(/[/?#]/);
  const authority = authorityEnd === -1 ? remainder : remainder.slice(0, authorityEnd);
  const rest = authorityEnd === -1 ? '' : remainder.slice(authorityEnd);

  const host = String(authority || '').trim();
  const pathPart = rest.split(/[?#]/, 1)[0];
  const pathSegments = String(pathPart || '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const origin = host ? `${scheme}://${host}` : `${scheme}://`;

  return {
    scheme,
    host,
    origin,
    pathSegments,
  };
}

/**
 * Given a URL, attempt to extract a product id if the link targets
 * `item/:id` either through the custom scheme or the public web origin.
 *
 * Supported patterns:
 * - zishes://item/:id
 * - zishes://app/item/:id
 * - https://zishes.com/item/:id
 * - Any domain that matches WEB_ORIGIN and uses the /item/:id path
 */
export function extractProductIdFromUrl(input) {
  const parsed = parseDeepLink(input);
  if (parsed?.type === 'product') return parsed.id;
  return null;
}

/**
 * Parse a URL and return a normalized payload describing the intent.
 */
export function parseDeepLink(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const parsed = parseUrlComponents(trimmed);
  if (!parsed) return null;

  const { scheme } = parsed;
  const host = normalizeHost(parsed.host);
  let combinedSegments = parsed.pathSegments;

  // Merge host into segments when scheme link omits the expected host (e.g., zishes://wallet)
  if (scheme === NORMALIZED_APP_SCHEME) {
    if (host && host !== NORMALIZED_APP_HOST) {
      combinedSegments = [host, ...parsed.pathSegments];
    }
  } else if (!combinedSegments.length && host) {
    combinedSegments = [host];
  }

  const matchesAppScheme = scheme === NORMALIZED_APP_SCHEME;
  const matchesWebOrigin = Boolean(NORMALIZED_WEB_ORIGIN) && normalizeOrigin(parsed.origin) === NORMALIZED_WEB_ORIGIN;
  const matchesWebHost = Boolean(NORMALIZED_WEB_HOST) && host === NORMALIZED_WEB_HOST;
  if (!matchesAppScheme && !matchesWebOrigin && !matchesWebHost) {
    return null;
  }

  if (!combinedSegments.length) return null;

  const normalizeSegment = (segment) => String(segment || '').trim().toLowerCase();
  const decodeSegment = (segment) => {
    try {
      return decodeURIComponent(segment);
    } catch (_err) {
      return segment;
    }
  };

  const [firstRaw, secondRaw, thirdRaw] = combinedSegments;
  const first = normalizeSegment(firstRaw);

  if (['item', 'product', 'details'].includes(first)) {
    if (!secondRaw) return null;
    return {
      type: 'product',
      id: decodeSegment(secondRaw),
      url: trimmed,
    };
  }

  if (['wallet', 'walletscreen'].includes(first)) {
    return {
      type: 'wallet',
      url: trimmed,
    };
  }

  if (['leaderboard', 'tournament'].includes(first)) {
    if (!secondRaw) return null;
    return {
      type: 'leaderboard',
      tournamentId: decodeSegment(secondRaw),
      productId: thirdRaw ? decodeSegment(thirdRaw) : null,
      url: trimmed,
    };
  }

  if (['upload-proof', 'uploadproof', 'seller-proof', 'proof'].includes(first)) {
    if (!secondRaw) return null;
    return {
      type: 'uploadProof',
      productId: decodeSegment(secondRaw),
      url: trimmed,
    };
  }

  if (['acknowledgement', 'acknowledge', 'ack', 'receiver', 'receipt'].includes(first)) {
    if (!secondRaw) return null;
    return {
      type: 'acknowledgement',
      tournamentId: decodeSegment(secondRaw),
      productId: thirdRaw ? decodeSegment(thirdRaw) : null,
      url: trimmed,
    };
  }

  return null;
}

export default {
  extractProductIdFromUrl,
  parseDeepLink,
};
