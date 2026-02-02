// Parse SDK wrapper to avoid Vite bundling issues with LiveQuery's events dependency
// The minified build has all dependencies pre-bundled and works in browsers

// Import the pre-built minified version which doesn't require the events module
import 'parse/dist/parse.min.js';

// The minified build assigns Parse to the global window object
declare global {
  interface Window {
    Parse: typeof import('parse');
  }
}

// Re-export the global Parse object
const Parse = window.Parse;
export default Parse;
