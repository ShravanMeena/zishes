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
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  const parsed = parseUrlComponents(raw);
  if (!parsed) {
    return null;
  }

  const { scheme } = parsed;
  const host = normalizeHost(parsed.host);
  const pathSegments = parsed.pathSegments;

  // Merge host into segments when we receive scheme URLs without the expected host.
  // Example: zishes://item/123 -> host=item, pathname=/123
  let combinedSegments = pathSegments;
  if (scheme === NORMALIZED_APP_SCHEME) {
    if (host && host !== NORMALIZED_APP_HOST) {
      combinedSegments = [host, ...pathSegments];
    }
  } else if (!pathSegments.length && host) {
    combinedSegments = [host];
  }

  // Allow both scheme (zishes://app/item/:id) and bare scheme (zishes://item/:id)
  const matchesAppScheme = scheme === NORMALIZED_APP_SCHEME;
  const matchesWebOrigin = Boolean(NORMALIZED_WEB_ORIGIN) && normalizeOrigin(parsed.origin) === NORMALIZED_WEB_ORIGIN;
  const matchesWebHost = Boolean(NORMALIZED_WEB_HOST) && host === NORMALIZED_WEB_HOST;

  if (!matchesAppScheme && !matchesWebOrigin && !matchesWebHost) {
    return null;
  }

  if (!combinedSegments.length) {
    return null;
  }

  const [first, second] = combinedSegments;
  if (first !== 'item' || !second) {
    return null;
  }

  try {
    return decodeURIComponent(second);
  } catch (_err) {
    return second;
  }
}

/**
 * Parse a URL and return a normalized payload describing the intent.
 * Currently only supports product details.
 */
export function parseDeepLink(url) {
  const productId = extractProductIdFromUrl(url);
  if (!productId) return null;
  return { type: 'product', id: productId, url };
}

export default {
  extractProductIdFromUrl,
  parseDeepLink,
};
