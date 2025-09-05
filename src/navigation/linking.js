// React Navigation linking configuration for deep links
// Supports:
// - Custom scheme: zishes://item/:id
// - Web: https://example.com/item/:id

const linking = {
  prefixes: ['zishes://', 'zishes://app', 'https://example.com'],
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
      // You can add other stacks if needed
    },
  },
};

export default linking;
