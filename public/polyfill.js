// Simple global polyfill
if (typeof self === 'undefined') {
  if (typeof global !== 'undefined') {
    global.self = global;
  } else if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
  }
}

if (typeof global === 'undefined') {
  if (typeof globalThis !== 'undefined') {
    globalThis.global = globalThis;
  }
}

if (typeof window === 'undefined') {
  if (typeof globalThis !== 'undefined') {
    globalThis.window = globalThis;
  }
}