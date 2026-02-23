import chroma from 'chroma-js';
import type { Swatch } from '../services/swatch-assets';
import { KDTree, type Vec3 } from './kd-tree';

const tree = new KDTree<Swatch>();

/**
 * Builds the KD-tree from the provided swatches using their OKLab coordinates.
 * Kept async for API compatibility with callers.
 */
export async function initColorSearch(swatches: Swatch[]): Promise<void> {
    tree.build(swatches.map(s => ({
        point: s.oklab as Vec3,
        data: s,
    })));
}

/**
 * Finds the closest swatch to the target OKLCH value using KD-tree nearest-neighbor search.
 * Distance is measured as Euclidean distance in OKLab space (a perceptually uniform metric).
 */
export async function findClosestColor(
    targetOklch: [number, number, number],
    excludeId?: string
): Promise<Swatch | null> {
    const [L, C, h] = targetOklch;
    const safeH = isNaN(h) ? 0 : h;
    const targetOklab = chroma.oklch(L, C, safeH).oklab() as Vec3;

    const result = tree.nearest(
        targetOklab,
        excludeId ? (s) => s.id !== excludeId : undefined
    );

    return result?.data ?? null;
}
