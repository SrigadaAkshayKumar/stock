// suppress-webpack-warnings.js
// This script suppresses the webpack-dev-server deprecation warnings
// until Create React App updates to use the new setupMiddlewares option

// Patch the process.emitWarning method
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, type, code, ctor) {
  if (
    type === 'DeprecationWarning' &&
    (warning.includes('onAfterSetupMiddleware') ||
     warning.includes('onBeforeSetupMiddleware') ||
     warning.includes("'onAfterSetupMiddleware' option is deprecated") ||
     warning.includes("'onBeforeSetupMiddleware' option is deprecated"))
  ) {
    // Suppress these specific deprecation warnings
    return;
  }
  return originalEmitWarning.call(this, warning, type, code, ctor);
};

// Also override process.emit
const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
  // Suppress specific webpack-dev-server deprecation warnings
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'DeprecationWarning' &&
    (data.message.includes('onAfterSetupMiddleware') ||
     data.message.includes('onBeforeSetupMiddleware') ||
     data.message.includes("'onAfterSetupMiddleware' option is deprecated") ||
     data.message.includes("'onBeforeSetupMiddleware' option is deprecated"))
  ) {
    // Suppress the webpack-dev-server middleware warnings
    return false;
  }

  return originalEmit.apply(process, arguments);
};

// Also suppress console warnings
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  if (
    message.includes('onAfterSetupMiddleware') ||
    message.includes('onBeforeSetupMiddleware') ||
    message.includes("'onAfterSetupMiddleware' option is deprecated") ||
    message.includes("'onBeforeSetupMiddleware' option is deprecated")
  ) {
    return;
  }
  return originalConsoleWarn.apply(console, arguments);
};
