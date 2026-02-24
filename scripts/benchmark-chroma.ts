
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chroma from 'chroma-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COLORS_DIR = path.resolve(__dirname, '..', 'public', 'colors');

const files = fs.readdirSync(COLORS_DIR).filter(f => f.endsWith('.json'));

let totalSwatches = 0;
const allRgbData: [number, number, number][] = [];

console.log('Loading color data...');
for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(COLORS_DIR, file), 'utf-8'));
    for (const collection of data.collections) {
        for (const swatch of collection.swatches) {
            allRgbData.push(swatch.rgb);
            totalSwatches++;
        }
    }
}

console.log(`Total swatches: ${totalSwatches}\n`);

const ITERATIONS = 100;

function benchmark(name: string, fn: () => void) {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        fn();
    }
    const end = performance.now();
    const total = end - start;
    const avg = total / ITERATIONS;
    console.log(`${name}: `);
    console.log(`  Total time for ${ITERATIONS} iterations: ${total.toFixed(2)}ms`);
    console.log(`  Average time per iteration (${totalSwatches} swatches): ${avg.toFixed(2)}ms`);
    console.log(`  Time per swatch: ${(avg / totalSwatches * 1000).toFixed(4)}µs\n`);
}

// Baseline: Just iterating
benchmark('Baseline (Iterate only)', () => {
    for (let i = 0; i < allRgbData.length; i++) {
        const rgb = allRgbData[i];
    }
});

// Chroma initialization
benchmark('Chroma Init (chroma.rgb)', () => {
    for (let i = 0; i < allRgbData.length; i++) {
        const [r, g, b] = allRgbData[i];
        const color = chroma.rgb(r, g, b);
    }
});

// Chroma initialization + OKLAB conversion
benchmark('Chroma Init + oklab()', () => {
    for (let i = 0; i < allRgbData.length; i++) {
        const [r, g, b] = allRgbData[i];
        const color = chroma.rgb(r, g, b);
        const oklab = color.oklab();
    }
});

// Chroma initialization + OKLCH conversion
benchmark('Chroma Init + oklch()', () => {
    for (let i = 0; i < allRgbData.length; i++) {
        const [r, g, b] = allRgbData[i];
        const color = chroma.rgb(r, g, b);
        const oklch = color.oklch();
    }
});

// Chroma initialization + both
benchmark('Chroma Init + oklab() + oklch()', () => {
    for (let i = 0; i < allRgbData.length; i++) {
        const [r, g, b] = allRgbData[i];
        const color = chroma.rgb(r, g, b);
        const oklab = color.oklab();
        const oklch = color.oklch();
    }
});
