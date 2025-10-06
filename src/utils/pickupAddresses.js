const ADDRESS_FIELDS = ['line1', 'line2', 'landmark', 'pincode', 'city', 'state'];

function createEmptyAddress(defaultCountry = '') {
  return {
    line1: '',
    line2: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    country: defaultCountry || '',
  };
}

export function createEmptyPickupAddresses(defaultCountry = '') {
  return {
    seller: createEmptyAddress(defaultCountry),
    receiver: createEmptyAddress(defaultCountry),
  };
}

export function normalizePickupAddressesForState(source, defaultCountry = '') {
  const base = createEmptyPickupAddresses(defaultCountry);
  if (!source) return base;
  return {
    seller: normalizeAddressForState(source.seller, base.seller, defaultCountry),
    receiver: normalizeAddressForState(source.receiver, base.receiver, defaultCountry),
  };
}

function normalizeAddressForState(sourceAddress, baseAddress, defaultCountry = '') {
  const result = { ...baseAddress };
  if (!sourceAddress) return result;
  ADDRESS_FIELDS.forEach((key) => {
    const value = sourceAddress[key];
    if (value !== undefined && value !== null) result[key] = String(value);
  });
  if (sourceAddress.country || defaultCountry) {
    result.country = String(sourceAddress.country || defaultCountry || '');
  }
  return result;
}

export function normalizePickupAddressesForSubmit(addresses, defaultCountry = '') {
  if (!addresses) return null;
  const seller = sanitizeAddressForSubmit(addresses.seller, defaultCountry);
  const receiver = sanitizeAddressForSubmit(addresses.receiver, defaultCountry);
  const hasSeller = hasAddress(seller);
  const hasReceiver = hasAddress(receiver);
  if (!hasSeller && !hasReceiver) return null;
  const payload = {};
  if (hasSeller) payload.seller = seller;
  if (hasReceiver) payload.receiver = receiver;
  return payload;
}

function sanitizeAddressForSubmit(address, defaultCountry = '') {
  const out = {};
  if (!address) return out;
  ADDRESS_FIELDS.forEach((key) => {
    const value = address[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) out[key] = trimmed;
    }
  });
  if (defaultCountry) out.country = defaultCountry;
  else if (typeof address.country === 'string' && address.country.trim()) out.country = address.country.trim();
  return out;
}

export function hasAddress(address) {
  if (!address) return false;
  return ADDRESS_FIELDS.some((key) => {
    const value = address[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export function hasPickupAddresses(addresses) {
  if (!addresses) return false;
  return hasAddress(addresses.seller) || hasAddress(addresses.receiver);
}

export function resolveProductCountry(fulfillment, item) {
  return (
    fulfillment?.product?.country ||
    fulfillment?.product?.location?.country ||
    fulfillment?.pickupAddresses?.seller?.country ||
    fulfillment?.pickupAddresses?.receiver?.country ||
    item?.raw?.country ||
    item?.raw?.location?.country ||
    item?.raw?.pickupAddress?.country ||
    item?.raw?.address?.country ||
    item?.country ||
    ''
  );
}

export default {
  createEmptyPickupAddresses,
  normalizePickupAddressesForState,
  normalizePickupAddressesForSubmit,
  hasAddress,
  hasPickupAddresses,
  resolveProductCountry,
};

