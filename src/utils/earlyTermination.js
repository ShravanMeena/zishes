function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function safeProgress(item) {
  const total = safeNumber(item?.playsTotal, 0);
  const done = safeNumber(item?.playsCompleted, 0);
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(1, done / total));
}

export function getEarlyTerminationContext(item) {
  if (!item) return null;
  const raw = item?.raw || {};
  const tournament = raw?.tournament || item?.tournament || null;
  const status = String(tournament?.status || item?.tournamentStatus || '').toUpperCase();

  const cfg = tournament?.earlyTermination || {}; // backend config object
  const hasConfig = cfg && typeof cfg === 'object' && Object.keys(cfg).length > 0;
  const ackEnabled = !!raw?.terms?.enableEarlyTerminationAck;
  const enabledFromConfig = hasConfig && ('enabled' in cfg) ? !!cfg.enabled : hasConfig;
  const enabled = ackEnabled || enabledFromConfig;

  const thresholdPct = (() => {
    const pct = Number(cfg?.thresholdPct ?? cfg?.threshold);
    if (Number.isFinite(pct) && pct > 0) return pct;
    const legacy = Number(tournament?.earlyTerminationThresholdPct);
    if (Number.isFinite(legacy) && legacy > 0) return legacy;
    return 80;
  })();

  let progressPct = Number(tournament?.progress ?? raw?.progressPct);
  if (Number.isFinite(progressPct)) {
    if (progressPct <= 1) progressPct *= 100;
  } else {
    const players = safeNumber(
      tournament?.numberOfPlayers ??
        tournament?.playsCompleted ??
        raw?.playsCompleted ??
        item?.playsCompleted,
      0
    );
    const expected = safeNumber(
      tournament?.expectedPlayers ??
        tournament?.totalSeats ??
        raw?.playsTotal ??
        item?.playsTotal,
      0
    );
    if (expected > 0) {
      progressPct = (players / expected) * 100;
    } else {
      progressPct = safeProgress(item) * 100;
    }
  }

  return {
    enabled,
    ackEnabled,
    config: hasConfig ? cfg : null,
    thresholdPct,
    progressPct,
    status,
  };
}

export function canShowEarlyTermination(context) {
  if (!context) return false;
  const status = context.status;
  if (!status || ['OVER', 'UNFILLED', 'CANCELLED', 'COMPLETED'].includes(status)) return false;
  if (context.ackEnabled) return true;
  if (!context.enabled) return false;
  const meetsThreshold = Number.isFinite(context.progressPct) && Number.isFinite(context.thresholdPct)
    ? context.progressPct >= context.thresholdPct
    : true;
  return meetsThreshold;
}

export default {
  safeProgress,
  getEarlyTerminationContext,
  canShowEarlyTermination,
};
