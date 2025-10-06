export function normalizeVersion(version) {
  if (!version) return [];
  const parts = String(version).split('.');
  return parts.map((part) => {
    const num = Number(part);
    return Number.isFinite(num) ? num : 0;
  });
}

export function compareVersions(a, b) {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i += 1) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }
  return 0;
}

export function isVersionLessThan(a, b) {
  return compareVersions(a, b) === -1;
}

export function isVersionGreaterThan(a, b) {
  return compareVersions(a, b) === 1;
}

