import { resolveProductCountry } from './pickupAddresses';

export const normalizeCountry = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

export const formatCountryLabel = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || 'the required country';
};

export const buildCountryRestrictionMessage = (country) => {
  const label = formatCountryLabel(country);
  if (label === 'the required country') {
    return 'Please update your country to play for this item.';
  }
  return `Please choose ${label} to play for this item.`;
};

export const getCountryRestriction = (entity, userCountry) => {
  if (!entity) return { restricted: false, productCountry: '' };
  const rawProduct = entity?.raw || entity || null;
  const fulfillment =
    rawProduct?.fulfillment ||
    entity?.fulfillment ||
    null;
  const itemLike = entity?.raw
    ? entity
    : {
        raw: rawProduct,
        country:
          entity?.country ||
          rawProduct?.country ||
          rawProduct?.location?.country ||
          '',
      };
  const productCountry = resolveProductCountry(fulfillment, itemLike);
  const normalizedProduct = normalizeCountry(productCountry);
  const normalizedUser = normalizeCountry(userCountry);
  if (!normalizedProduct) {
    return { restricted: false, productCountry: productCountry || '' };
  }
  if (normalizedUser && normalizedUser === normalizedProduct) {
    return { restricted: false, productCountry: productCountry || '' };
  }
  return { restricted: true, productCountry: productCountry || '' };
};

export default {
  normalizeCountry,
  formatCountryLabel,
  buildCountryRestrictionMessage,
  getCountryRestriction,
};
