// Simple polyfill for webpack ProvidePlugin
if (typeof global !== 'undefined') {
  global.self = global;
  global.window = global;
  global.document = {};
  global.navigator = {};
  global.location = {};
}

module.exports = global || globalThis || {};