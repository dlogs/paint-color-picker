#!/usr/bin/env tsx
/**
 * scripts/build-colors.ts
 *
 * Reads all .ase files from ase-files/{Brand}/{date}_{Collection}.ase,
 * parses them, and writes one JSON file per brand to public/colors/{Brand}.json.
 *
 * Run with: npx tsx scripts/build-colors.ts
 * Or via:   npm run build:colors
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';
import { parseAse } from '../src/util/ase-parser';
import type { BrandAsset, CollectionAsset, SwatchAsset } from '../src/services/swatch-assets';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASE_DIR = path.resolve(__dirname, '..', 'ase-files');
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'colors');


// ── Filename parsing: "2026_02_22_Classic_Colors.ase" ────────────────────────

function parseFilename(filename: string): { retrievalDate: string; collection: string } {
    const base = filename.replace(/\.ase$/i, '');
    const match = base.match(/^(\d{4}_\d{2}_\d{2})_(.+)$/);
    if (!match) return { retrievalDate: '', collection: base.replace(/_/g, ' ') };
    return {
        retrievalDate: match[1].replace(/_/g, '-'),
        collection: match[2].replace(/_/g, ' '),
    };
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });


const brandDirs = fs.readdirSync(ASE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

for (const brandDir of brandDirs) {
    readBrand(brandDir);
}
console.log('Done.');


function readBrand(brandDir: string) {
    const brand = brandDir.replace(/_/g, ' ');
    const brandPath = path.join(ASE_DIR, brandDir);
    const aseFiles = fs.readdirSync(brandPath).filter(f => f.toLowerCase().endsWith('.ase'));

    console.log(`  Parsing Brand: ${brand}`);
    const brandAsset: BrandAsset = {
        brand,
        retrievalDate: '',
        collections: [],
    };

    for (const filename of aseFiles) {
        try {
            brandAsset.collections.push(readCollectionAseFile(filename, brandDir));
        } catch (err) {
            console.error(`    ERROR: ${(err as Error).message}`);
        }
    }

    const outPath = path.join(OUT_DIR, `${brandDir}.json`);
    fs.writeFileSync(outPath, JSON.stringify(brandAsset, null, 2), 'utf-8');
    console.log(`  ✓ Wrote ${brandAsset.collections.length} collections → ${outPath}\n`);
}

function readCollectionAseFile(filename: string, brandDir: string): CollectionAsset {
    const { retrievalDate, collection } = parseFilename(filename);
    console.log(`  Parsing: ${brandDir}/${filename} → "${collection}" (${retrievalDate})`);
    const buf = fs.readFileSync(path.join(ASE_DIR, brandDir, filename));
    const collectionAsset: CollectionAsset = {
        collection,
        swatches: parseAse(buf.buffer).map(color => ({
            id: nanoid(),
            name: color.name,
            rgb: color.color.rgb(),
            oklab: color.color.oklab(),
            oklch: color.color.oklch(),
        }))
    };
    console.log(`    → ${collectionAsset.swatches.length} swatches`);
    return collectionAsset;
}

