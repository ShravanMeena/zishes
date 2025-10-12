function normalizeKey(value) {
  if (value == null) return null;
  const str = String(value).trim();
  return str ? str : null;
}

export function collectPlanKeys(plan) {
  if (!plan) return [];
  const keys = [
    plan._id,
    plan.id,
    plan.planId,
    plan.plan_id,
    plan.razorpayPlanId,
    plan.razorpay_plan_id,
    plan.externalPlanId,
    plan.external_plan_id,
    plan.legacyPlanId,
    plan.legacy_plan_id,
    plan.code,
    plan.slug,
  ];
  if (Array.isArray(plan.aliases)) keys.push(...plan.aliases);
  if (Array.isArray(plan.ids)) keys.push(...plan.ids);
  return keys
    .map(normalizeKey)
    .filter(Boolean);
}

export function buildPlanLookup(plans) {
  const map = new Map();
  if (!Array.isArray(plans)) return map;
  plans.forEach(plan => {
    collectPlanKeys(plan).forEach(key => {
      if (key && !map.has(key)) {
        map.set(key, plan);
      }
    });
  });
  return map;
}

export function findPlanForSubscription(subscription, lookup) {
  if (!subscription || !lookup || typeof lookup.get !== 'function') return null;
  const keys = new Set();
  collectPlanKeys(subscription?.plan).forEach(key => keys.add(key));

  [
    subscription?.plan_id,
    subscription?.planId,
    subscription?.razorpayPlanId,
    subscription?.razorpay_plan_id,
    subscription?.planID,
    subscription?.planid,
  ]
    .map(normalizeKey)
    .forEach(key => {
      if (key) keys.add(key);
    });

  for (const key of keys) {
    if (!key) continue;
    const plan = lookup.get(key);
    if (plan) return plan;
  }
  return null;
}

export default {
  collectPlanKeys,
  buildPlanLookup,
  findPlanForSubscription,
};
