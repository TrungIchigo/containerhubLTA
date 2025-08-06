// Global polyfill for server-side rendering - must be executed before any other code
if (typeof global !== 'undefined') {
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
  if (typeof global.window === 'undefined') {
    global.window = global;
  }
}

if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  if (typeof globalThis.global === 'undefined') {
    globalThis.global = globalThis;
  }
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
}

// Ensure self is always defined
if (typeof self === 'undefined') {
  if (typeof global !== 'undefined') {
    global.self = global;
  } else if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
  }
}