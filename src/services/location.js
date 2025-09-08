import { Platform } from 'react-native';
import axios from 'axios';

async function getPosition(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const geo = (typeof navigator !== 'undefined' && navigator.geolocation) ? navigator.geolocation : null;
    if (!geo || !geo.getCurrentPosition) {
      reject(new Error('Geolocation not available'));
      return;
    }
    try {
      geo.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err || new Error('Failed to get position')),
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 }
      );
    } catch (e) {
      reject(e);
    }
  });
}

async function reverseGeocode(lat, lon) {
  // Use OpenStreetMap Nominatim reverse geocoding (no key). Respectful, light usage only.
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'zishes-app/1.0',
      'Accept-Language': 'en',
    },
    timeout: 8000,
  });
  const addr = res?.data?.address || {};
  const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.state_district || addr.state || null;
  const country = addr.country || null;
  const countryCode = (addr.country_code || '').toUpperCase() || null;
  return { city, country, countryCode };
}

async function geoFromIP() {
  // Fallback using IP geolocation if GPS not available or denied
  // Try ipapi first; if it fails, try ipinfo
  try {
    const r1 = await axios.get('https://ipapi.co/json/', { timeout: 6000 });
    const { city, country_name: country, country_code } = r1?.data || {};
    return { city: city || null, country: country || null, countryCode: (country_code || '').toUpperCase() || null };
  } catch {}
  try {
    const r2 = await axios.get('https://ipinfo.io/json', { timeout: 6000 });
    const { city, country } = r2?.data || {};
    return { city: city || null, country: null, countryCode: (country || '').toUpperCase() || null };
  } catch {}
  return { city: null, country: null, countryCode: null };
}

export async function detectCityCountry() {
  // 1) Try GPS
  try {
    const pos = await getPosition(8000);
    const { latitude, longitude } = pos?.coords || {};
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      const place = await reverseGeocode(latitude, longitude);
      return { method: 'gps', ...place };
    }
  } catch {}

  // 2) Fallback to IP geolocation
  try {
    const place = await geoFromIP();
    return { method: 'ip', ...place };
  } catch {}

  return { method: 'none', city: null, country: null, countryCode: null };
}

export default { detectCityCountry };

