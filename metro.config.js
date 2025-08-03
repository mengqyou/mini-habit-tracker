const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration with size optimizations
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    minifierConfig: {
      // Enable aggressive minification for smaller bundle
      mangle: {
        keep_fnames: false,  // Don't keep function names
      },
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true, // Remove debugger statements  
        dead_code: true,     // Remove unreachable code
      },
    },
  },
  serializer: {
    // Enable tree shaking to remove unused code
    processModuleFilter: (module) => {
      // Remove unused React Native demo components
      if (module.path.includes('node_modules/@react-native/new-app-screen')) {
        return false;
      }
      return true;
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
