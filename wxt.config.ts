import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    name: 'TabSquad',
    description: 'Keep tab groups organized: route links spawned from a group elsewhere.',
    permissions: ['tabs', 'tabGroups', 'webNavigation', 'storage'],
    action: {
      default_title: 'TabSquad',
    },
  },
});
