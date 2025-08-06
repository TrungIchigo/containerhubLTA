// Polyfills for server-side rendering
// Fix 'self is not defined' error in Next.js server environment

// Ensure global is available
if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis;
}

// Ensure self is available in server environment
if (typeof self === 'undefined') {
  if (typeof global !== 'undefined') {
    (global as any).self = global;
  } else if (typeof globalThis !== 'undefined') {
    (globalThis as any).self = globalThis;
  }
}

// Additional polyfills for compatibility
if (typeof globalThis !== 'undefined') {
  if (typeof (globalThis as any).global === 'undefined') {
    (globalThis as any).global = globalThis;
  }
  
  if (typeof (globalThis as any).self === 'undefined') {
    (globalThis as any).self = globalThis;
  }
}