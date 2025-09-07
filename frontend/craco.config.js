const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable source-map-loader for node_modules
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.enforce === 'pre' && rule.use && rule.use.some(use => use.loader && use.loader.includes('source-map-loader'))) {
          rule.exclude = /node_modules/;
        }
      });
      
      return webpackConfig;
    },
  },
}; 