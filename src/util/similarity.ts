import chroma from 'chroma-js';
import type { Swatch } from '../types/swatch';
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

/**
 * Calculates the Euclidean distance between two OKLab colors, multiplying by 100 to match standard Delta-E.
 */
export function calculateDeltaE(oklab1: [number, number, number], oklab2: [number, number, number]): number {
    return Math.sqrt(
        Math.pow(oklab1[0] - oklab2[0], 2) +
        Math.pow(oklab1[1] - oklab2[1], 2) +
        Math.pow(oklab1[2] - oklab2[2], 2)
    ) * 100;
}

/**
 * Calculates the Euclidean distance between a target OKLCH and an OKLab color.
 */
export function calculateDeltaEFromOklch(targetOklch: [number, number, number], oklab2: [number, number, number]): number {
    const targetOklab = chroma.oklch(targetOklch[0], targetOklch[1], targetOklch[2]).oklab();
    return calculateDeltaE(targetOklab as [number, number, number], oklab2);
}
