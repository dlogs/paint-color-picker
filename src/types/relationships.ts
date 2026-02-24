import type { Swatch } from './swatch';

export interface RelationshipMatch {
    swatch: Swatch;
    targetOklch: [number, number, number];
}
