const { spawn } = require('child_process');
const path = require('path');

// Override console.warn to filter out specific warnings
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  if (
    message.includes('onAfterSetupMiddleware') ||
    message.includes('onBeforeSetupMiddleware') ||
    message.includes("'onAfterSetupMiddleware' option is deprecated") ||
    message.includes("'onBeforeSetupMiddleware' option is deprecated")
  ) {
    return; // Suppress these specific warnings
  }
  return originalWarn.apply(console, arguments);
};

// Override process.emit to catch deprecation warnings
const originalEmit = process.emit;
process.emit = function(name, data, ...args) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'DeprecationWarning' &&
    (data.message.includes('onAfterSetupMiddleware') ||
     data.message.includes('onBeforeSetupMiddleware'))
  ) {
    return false; // Suppress the warning
  }
  return originalEmit.apply(process, arguments);
};

// Start react-scripts - Use the actual JS file on Windows
const reactScriptsPath = path.join(__dirname, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');
const child = spawn('node', [reactScriptsPath, 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    GENERATE_SOURCEMAP: 'false'
  }
});

child.on('exit', (code) => {
  process.exit(code);
});
