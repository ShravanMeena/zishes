import SuperTokens from 'supertokens-react-native';
import { AUTH_DOMAIN, AUTH_API_BASE_PATH } from './api';

let hasInitialised = false;

function resolveHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[SuperTokens] Failed to parse hostname from', url, err?.message || err);
    }
    return undefined;
  }
}

export function initSuperTokens(customConfig = {}) {
  if (hasInitialised) {
    return;
  }

  const config = {
    apiDomain: AUTH_DOMAIN,
    apiBasePath: AUTH_API_BASE_PATH,
    sessionTokenBackendDomain: resolveHostname(AUTH_DOMAIN),
    tokenTransferMethod: 'header',
    ...customConfig,
  };

  SuperTokens.init(config);
  hasInitialised = true;
}

export default initSuperTokens;
