const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['created', 'active', 'authenticated', 'pending', 'inprogress']);
const CANCELLED_SUBSCRIPTION_STATUSES = new Set(['cancelled', 'completed', 'halted', 'paused', 'expired']);

function isSubscriptionCancellationScheduled(subscription) {
  if (!subscription) return false;
  return Boolean(
    subscription?.razorpaySubscriptionCancelledAt
    || subscription?.razorpaySubscriptionEndsAt
    || subscription?.cancelledAt
    || subscription?.endsAt
    || subscription?.cancel_at
    || subscription?.ended_at
  );
}

function formatStatusLabel(status) {
  if (!status) return 'Unknown';
  const text = String(status).replace(/_/g, ' ').toLowerCase();
  return text.replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}

function categorizeSubscriptionStatus(status, subscription = null) {
  const raw = String(status || '').trim().toLowerCase();
  const cancellationScheduled = isSubscriptionCancellationScheduled(subscription);
  if (!raw) {
    return { state: 'unknown', raw: '', label: formatStatusLabel(raw), scheduled: cancellationScheduled };
  }
  if (ACTIVE_SUBSCRIPTION_STATUSES.has(raw)) {
    if (cancellationScheduled) {
      return {
        state: 'scheduled_cancel',
        raw,
        label: 'Cancellation Scheduled',
        scheduled: true,
      };
    }
    return { state: 'active', raw, label: formatStatusLabel(raw), scheduled: false };
  }
  if (CANCELLED_SUBSCRIPTION_STATUSES.has(raw) || cancellationScheduled) {
    return {
      state: 'cancelled',
      raw,
      label: formatStatusLabel(raw || 'cancelled'),
      scheduled: cancellationScheduled,
    };
  }
  return { state: 'other', raw, label: formatStatusLabel(raw), scheduled: cancellationScheduled };
}

export {
  ACTIVE_SUBSCRIPTION_STATUSES,
  CANCELLED_SUBSCRIPTION_STATUSES,
  categorizeSubscriptionStatus,
  isSubscriptionCancellationScheduled,
  formatStatusLabel,
};

export default {
  ACTIVE_SUBSCRIPTION_STATUSES,
  CANCELLED_SUBSCRIPTION_STATUSES,
  categorizeSubscriptionStatus,
  isSubscriptionCancellationScheduled,
  formatStatusLabel,
};
