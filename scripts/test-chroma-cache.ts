
import chroma from 'chroma-js';

const color = chroma.rgb(255, 128, 0);

const ITERATIONS = 1000000;

console.log('Testing caching behavior...');

// First call to "prime" any potential cache
color.oklch();

const start1 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    color.oklch();
}
const end1 = performance.now();
console.log(`Repeated calls to color.oklch(): ${(end1 - start1).toFixed(2)}ms`);

const start2 = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    chroma.rgb(255, 128, 0).oklch();
}
const end2 = performance.now();
console.log(`Fresh calls (Init + oklch): ${(end2 - start2).toFixed(2)}ms`);

// Test if it returns the same object/array reference
const a = color.oklch();
const b = color.oklch();
console.log(`\nReturns same reference? ${a === b}`);
