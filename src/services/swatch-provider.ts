import chroma from 'chroma-js';
import type { BrandAsset } from '../types/assets';
import type { Swatch } from '../types/swatch';

// Import JSON files natively handled by Vite.
// This bundles them and forces them to load with the JS chunk, eliminating the fetch waterfall.
import bmColors from '../../src/colors/Benjamin_Moore.json';
import swColors from '../../src/colors/Sherwin_Williams.json';

const BRAND_ASSETS = [
    bmColors as unknown as BrandAsset,
    swColors as unknown as BrandAsset,
];

// Helper to map DTO to Domain Model
function mapBrandAssetToSwatches(asset: BrandAsset): Swatch[] {
    return asset.collections.flatMap(collection =>
        collection.swatches.map(swatch => {
            const color = chroma(swatch.hex);
            return {
                id: swatch.id,
                name: swatch.name,
                number: swatch.number,
                brand: asset.brand,
                collection: collection.collection,
                rgb: color.rgb(),
                oklab: color.oklab(),
                oklch: color.oklch(),
            };
        })
    );
}

let cachedSwatches: Swatch[] | null = null;

export async function fetchBuiltInSwatches(): Promise<Swatch[]> {
    if (cachedSwatches) return cachedSwatches;

    // Since we statically imported them, they are available instantly synchronously.
    cachedSwatches = BRAND_ASSETS.flatMap(asset => mapBrandAssetToSwatches(asset));

    return cachedSwatches;
}
