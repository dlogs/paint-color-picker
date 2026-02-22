import chroma from 'chroma-js';

export interface AseColor {
    id: string;
    name: string;
    mode: string;
    color: number[];
    hsl: [number, number, number];
    type: number;
    brand?: string;
    collection?: string;
}

export function parseASE(buffer: ArrayBuffer, brand?: string, collection?: string): AseColor[] {
    const view = new DataView(buffer);
    let offset = 0;

    // Check Signature: "ASEF"
    const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (sig !== 'ASEF') throw new Error('Not a valid ASE file');

    offset = 12; // Skip header and version info
    const colors: AseColor[] = [];

    while (offset < buffer.byteLength) {
        const blockType = view.getUint16(offset);
        const blockLength = view.getUint32(offset + 2);
        offset += 6;

        if (blockType === 0x01 || blockType === 0x0001) { // Color Block
            const nameLen = view.getUint16(offset);
            let name = "";
            for (let i = 0; i < nameLen - 1; i++) {
                name += String.fromCharCode(view.getUint16(offset + 2 + i * 2));
            }

            const colorModeOffset = offset + 2 + (nameLen * 2);
            const mode = String.fromCharCode(
                view.getUint8(colorModeOffset),
                view.getUint8(colorModeOffset + 1),
                view.getUint8(colorModeOffset + 2),
                view.getUint8(colorModeOffset + 3)
            ).trim();

            let colorVals: number[] = [];
            let hsl: [number, number, number] = [0, 0, 0];
            let type = 0;

            if (mode === "RGB") {
                const r = view.getFloat32(colorModeOffset + 4);
                const g = view.getFloat32(colorModeOffset + 8);
                const b = view.getFloat32(colorModeOffset + 12);
                colorVals = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
                hsl = chroma(colorVals as [number, number, number]).hsl();
                type = view.getUint16(colorModeOffset + 16);
            } else if (mode === "CMYK") {
                const c = view.getFloat32(colorModeOffset + 4);
                const m = view.getFloat32(colorModeOffset + 8);
                const y = view.getFloat32(colorModeOffset + 12);
                const k = view.getFloat32(colorModeOffset + 16);
                colorVals = [Math.round(c * 255), Math.round(m * 255), Math.round(y * 255), Math.round(k * 255)];
                hsl = chroma.cmyk(c, m, y, k).hsl();
                type = view.getUint16(colorModeOffset + 20);
            } else if (mode === "LAB") {
                const l = view.getFloat32(colorModeOffset + 4);
                const a = view.getFloat32(colorModeOffset + 8);
                const b = view.getFloat32(colorModeOffset + 12);
                colorVals = [l, a, b];
                hsl = chroma.lab(l * 100, a, b).hsl();
                type = view.getUint16(colorModeOffset + 16);
            }

            if (colorVals.length > 0) {
                if (isNaN(hsl[0])) hsl[0] = 0;

                colors.push({
                    id: crypto.randomUUID(),
                    name,
                    mode,
                    color: colorVals,
                    hsl,
                    type,
                    brand,
                    collection
                });
            }
        }
        offset += blockLength;
    }
    return colors;
}