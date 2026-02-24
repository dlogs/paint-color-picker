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
import Sqids from 'sqids';
import { parseAse } from '../src/util/ase-parser';
import type { BrandAsset, CollectionAsset, SwatchAsset } from '../src/types/assets';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASE_DIR = path.resolve(__dirname, '..', 'ase-files');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'colors');


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

let index = 0;
const sqids = new Sqids({ minLength: 8 });
function getId() {
    return sqids.encode([index++]);
}

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

    const brandAsset: BrandAsset = {
        brand,
        retrievalDate: '',
        collections: [],
    };

    console.log(`  Parsing Brand: ${brand}`);
    for (const filename of aseFiles) {
        try {
            brandAsset.collections.push(readCollectionAseFile(filename, brandDir, brand));
        } catch (err) {
            console.error(`    ERROR: ${(err as Error).message}`);
        }
    }

    const outPath = path.join(OUT_DIR, `${brandDir}.json`);
    fs.writeFileSync(outPath, JSON.stringify(brandAsset), 'utf-8');
    console.log(`  ✓ Wrote ${brandAsset.collections.length} collections → ${outPath}\n`);
}

function readCollectionAseFile(filename: string, brandDir: string, brand: string): CollectionAsset {
    const { retrievalDate, collection } = parseFilename(filename);
    console.log(`  Parsing: ${brandDir}/${filename} → "${collection}" (${retrievalDate})`);
    const buf = fs.readFileSync(path.join(ASE_DIR, brandDir, filename));
    const collectionAsset: CollectionAsset = {
        collection,
        swatches: parseAse(buf.buffer).map(color => {
            const { name, number } = parseColorName(color.name, brand);
            return {
                id: getId(),
                name,
                number,
                hex: color.color.hex(),
            };
        })
    };
    console.log(`    → ${collectionAsset.swatches.length} swatches`);
    return collectionAsset;
}

function parseColorName(rawName: string, brand: string): { name: string; number?: string } {
    if (brand === 'Sherwin Williams') {
        // SW Format: "Mulberry Silk (SW 0001)"
        const swMatch = rawName.match(/^(.*?)\s*\((SW\s+\d+)\)$/i);
        if (swMatch) {
            return { name: swMatch[1].trim(), number: swMatch[2].trim() };
        }
    } else if (brand === 'Benjamin Moore') {
        // BM format: "001 Pink Powderpuff" or "CC-2 Raphael" or "OC-17 White Dove" or "2120-10 Jet Black"
        const bmMatch = rawName.match(/^([A-Z]{0,3}-?\d+(?:-\d+)?)\s+(.*)$/i);
        if (bmMatch) {
            return { number: bmMatch[1].trim(), name: bmMatch[2].trim() };
        }
    }
    return { name: rawName };
}

