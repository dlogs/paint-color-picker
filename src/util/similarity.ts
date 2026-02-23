import { create, insertMultiple, search, type AnyOrama } from '@orama/orama';
import chroma from 'chroma-js';
import type { Swatch } from '../services/swatch-assets';

let db: AnyOrama | null = null;
const colorMap = new Map<string, Swatch>();

/**
 * Initializes the Orama database with the provided colors.
 * Converts OKLCH to OKLab vectors for similarity search.
 */
export async function initColorSearch(allColors: Swatch[]) {
    // Clear existing map
    colorMap.clear();

    db = await create({
        schema: {
            id: 'string',
            oklab: 'vector[3]'
        }
    });

    const documents = allColors.map(c => {
        colorMap.set(c.id, c);
        // Convert oklch to oklab vector
        const [L, C, h] = c.oklch;
        // chroma.oklch takes (L, C, h) where h is 0-360
        const oklab = chroma.oklch(L, C, h).oklab();
        return {
            id: c.id,
            oklab
        };
    });

    await insertMultiple(db, documents);
}

/**
 * Finds the closest color to the target OKLCH values using vector distance in OKLab space.
 */
export async function findClosestColor(targetOklch: [number, number, number], excludeId?: string): Promise<Swatch | null> {
    if (!db) return null;

    const [L, C, h] = targetOklch;
    // Fix for achromatic colors where hue might be NaN
    const safeH = isNaN(h) ? 0 : h;
    const targetOklab = chroma.oklch(L, C, safeH).oklab();

    const results = await search(db, {
        mode: 'vector',
        vector: {
            value: targetOklab,
            property: 'oklab'
        },
        limit: excludeId ? 2 : 1 // If excluding, get top 2
    });

    if (results.hits && results.hits.length > 0) {
        for (const hit of results.hits) {
            const doc = hit.document as { id: string };
            if (doc.id !== excludeId) {
                return colorMap.get(doc.id) || null;
            }
        }
    }

    return null;
}
