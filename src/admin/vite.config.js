export default (config) => {
  // Minimal Vite configuration to fix theme issues
  config.optimizeDeps = {
    ...config.optimizeDeps,
    include: [
      // Essential modules that need pre-bundling
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'shallowequal',
      'lodash',
      'hoist-non-react-statics',
    ],
  };

  // Ensure proper module resolution
  config.resolve = {
    ...config.resolve,
    dedupe: ['react', 'react-dom', 'styled-components', '@strapi/design-system'],
  };

  return config;
};