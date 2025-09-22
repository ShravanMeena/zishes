import inAppMessaging from '@react-native-firebase/in-app-messaging';

let initialized = false;
let lastTriggeredEvent = null;

export async function configureInAppMessaging() {
  if (initialized) return;
  // eslint-disable-next-line no-console
  console.log('[IAM] configureInAppMessaging invoked');
  try {
    await inAppMessaging().setAutomaticDataCollectionEnabled(true);
    // eslint-disable-next-line no-console
    console.log('[IAM] automatic data collection enabled');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[IAM] enable data collection failed:', err?.message || err);
  }
  try {
    await inAppMessaging().setMessagesDisplaySuppressed(false);
    // eslint-disable-next-line no-console
    console.log('[IAM] message display suppression disabled');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[IAM] suppress toggle failed:', err?.message || err);
  }
  initialized = true;
}

export async function triggerOfferForCountry(countryName) {
  const normalized = String(countryName || '').trim().toLowerCase();
  const event = normalized === 'india' ? 'subscription_offer' : 'topup_offer';
  if (lastTriggeredEvent === event) return;

  await configureInAppMessaging();

  try {
    // eslint-disable-next-line no-console
    console.log('[IAM] triggering event', event, 'for country', countryName || '(unknown)');
    await inAppMessaging().triggerEvent(event);
    lastTriggeredEvent = event;
    // eslint-disable-next-line no-console
    console.log('[IAM] triggerEvent success', event);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[IAM] triggerEvent failed:', err?.message || err);
  }
}
