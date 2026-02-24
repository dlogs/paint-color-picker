import chroma from 'chroma-js';
import type { BrandAsset } from '../types/assets';
import type { Swatch } from '../types/swatch';

const BRAND_ASSET_URLS = [
    '/colors/Benjamin_Moore.json',
    '/colors/Sherwin_Williams.json',
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

export async function fetchBuiltInSwatches(): Promise<Swatch[]> {
    const results = await Promise.allSettled(
        BRAND_ASSET_URLS.map(url =>
            fetch(url).then(res => {
                if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
                return res.json() as Promise<BrandAsset>;
            })
        )
    );

    return results.flatMap(r =>
        r.status === 'fulfilled' ? mapBrandAssetToSwatches(r.value) : []
    );
}
