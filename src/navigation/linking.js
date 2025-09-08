// React Navigation linking configuration for deep links
// Supports:
// - Custom scheme: zishes://app/item/:id
// - Web: https://<WEB_ORIGIN>/item/:id
import { APP_SCHEME, APP_HOST, WEB_ORIGIN } from '../config/links';

const linking = {
  // Allow both plain scheme and scheme with host for flexibility across platforms
  prefixes: [
    `${APP_SCHEME}://`,
    `${APP_SCHEME}://${APP_HOST}`,
    WEB_ORIGIN,
  ],
  config: {
    screens: {
      // AppTabs root
      Home: {
        screens: {
          Details: 'item/:id',
          // optional mapping for home index
          HomeIndex: 'home',
        },
      },
    },
  },
};

export default linking;
