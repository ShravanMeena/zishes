import { APP_SCHEME, APP_HOST, WEB_ORIGIN } from '../config/links';

// Build the canonical web URL for a product (good for sharing)
export function buildWebProductUrl(id) {
  const origin = String(WEB_ORIGIN || '').replace(/\/+$/, '');
  return `${origin}/item/${encodeURIComponent(id)}`;
}

// Build the app-scheme URL (works when recipients can open custom schemes)
export function buildAppProductUrl(id) {
  // Use host to match Android intent-filter, iOS will ignore host
  const host = String(APP_HOST || '').replace(/^\/+|\/+$/g, '');
  return `${APP_SCHEME}://${host ? `${host}/` : ''}item/${encodeURIComponent(id)}`;
}

// Prefer web link for broad compatibility; consumers with proper universal link setup
// will open the app, others will open the website.
export function buildShareUrlForProduct(id) {
  return buildWebProductUrl(id);
}

export default { buildWebProductUrl, buildAppProductUrl, buildShareUrlForProduct };
