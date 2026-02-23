/**
 * A generic 3D KD-tree for nearest-neighbor search.
 *
 * Build: O(n log² n)  — sorts at each level
 * Query: O(log n) average, O(n) worst case (degenerate splits)
 *
 * The tree is built from an array of { point, data } entries where `point`
 * is a [x, y, z] tuple. Any payload type `T` can be stored alongside each point.
 *
 * Serialization: the tree is a linked node structure. To persist it, walk and
 * flatten to an array; to restore, rebuild from the same point set (build is fast).
 */

export type Vec3 = [number, number, number];

interface KDNode<T> {
    point: Vec3;
    data: T;
    axis: 0 | 1 | 2;
    left: KDNode<T> | null;
    right: KDNode<T> | null;
}

/** Squared Euclidean distance between two 3D points. */
function distSq(a: Vec3, b: Vec3): number {
    const dX = a[0] - b[0];
    const dY = a[1] - b[1];
    const dZ = a[2] - b[2];
    return dX * dX + dY * dY + dZ * dZ;
}

function buildNode<T>(
    points: Array<{ point: Vec3; data: T }>,
    depth: number
): KDNode<T> | null {
    if (points.length === 0) return null;

    // Cycle through axes: 0 → 1 → 2 → 0 → ...
    const axis = (depth % 3) as 0 | 1 | 2;

    // Median split on this axis for balanced tree
    points.sort((a, b) => a.point[axis] - b.point[axis]);
    const mid = Math.floor(points.length / 2);

    return {
        point: points[mid].point,
        data: points[mid].data,
        axis,
        left: buildNode(points.slice(0, mid), depth + 1),
        right: buildNode(points.slice(mid + 1), depth + 1),
    };
}

export interface KDNearest<T> {
    data: T;
    distSq: number;
}

export class KDTree<T> {
    private root: KDNode<T> | null = null;

    /**
     * Build the tree from a list of points. Mutates the input array
     * for sorting during construction — pass a copy if you need to preserve order.
     */
    build(points: Array<{ point: Vec3; data: T }>): void {
        this.root = buildNode([...points], 0);
    }

    /**
     * Find the nearest neighbor to `target`.
     * Optionally pass `filter` to exclude certain data items from consideration
     * (e.g. to exclude the query point itself).
     */
    nearest(target: Vec3, filter?: (data: T) => boolean): KDNearest<T> | null {
        let best: KDNearest<T> | null = null;

        const search = (node: KDNode<T> | null): void => {
            if (node === null) return;

            const d = distSq(target, node.point);

            if (!filter || filter(node.data)) {
                if (best === null || d < best.distSq) {
                    best = { data: node.data, distSq: d };
                }
            }

            // Recurse into the side the target falls on first (more likely to be closer)
            const axisDiff = target[node.axis] - node.point[node.axis];
            const nearChild = axisDiff <= 0 ? node.left : node.right;
            const farChild = axisDiff <= 0 ? node.right : node.left;

            search(nearChild);

            // Only visit the far side if the splitting plane is within reach of current best
            if (best === null || axisDiff * axisDiff < best.distSq) {
                search(farChild);
            }
        };

        search(this.root);
        return best;
    }
}
