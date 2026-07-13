const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Add WASM asset support
config.resolver.assetExts.push('wasm');

// 2. Prefer React Native/browser package conditions for web bundling
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'import', 'default'];

// 3. Add COEP and COOP headers to support SharedArrayBuffer
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

module.exports = config;
