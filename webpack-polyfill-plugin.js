class PolyfillPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('PolyfillPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'PolyfillPlugin',
          stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          // Find vendors.js and inject polyfill at the beginning
          Object.keys(assets).forEach((assetName) => {
            if (assetName.includes('vendors') && assetName.endsWith('.js')) {
              const asset = assets[assetName];
              const source = asset.source();
              
              const polyfillCode = `
// Global polyfill injection
if (typeof self === 'undefined') {
  if (typeof global !== 'undefined') {
    global.self = global;
  } else if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
  }
}
if (typeof global === 'undefined' && typeof globalThis !== 'undefined') {
  globalThis.global = globalThis;
}
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  globalThis.window = globalThis;
}
`;
              
              const newSource = polyfillCode + source;
              
              compilation.updateAsset(assetName, {
                source: () => newSource,
                size: () => newSource.length
              });
            }
          });
        }
      );
    });
  }
}

module.exports = PolyfillPlugin;