import chroma from 'chroma-js';

export interface AseEntry {
    name: string;
    color: chroma.Color;
    type: number;
}

class DataViewWrapper {
    private view: DataView;
    offset: number;

    constructor(buffer: ArrayBuffer) {
        this.view = new DataView(buffer);
        this.offset = 0;
    }

    skip(bytes: number): void {
        this.offset += bytes;
    }

    done(): boolean {
        return this.offset >= this.view.byteLength;
    }

    getUint8(): number {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    getUint8Array(length: number): number[] {
        const value = [];
        for (let i = 0; i < length; i++) value.push(this.getUint8());
        return value;
    }

    getUint16(): number {
        const value = this.view.getUint16(this.offset);
        this.offset += 2;
        return value;
    }

    getUint32(): number {
        const value = this.view.getUint32(this.offset);
        this.offset += 4;
        return value;
    }

    getFloat32(): number {
        const value = this.view.getFloat32(this.offset);
        this.offset += 4;
        return value;
    }

    getFloat32Array(length: number): number[] {
        const value = [];
        for (let i = 0; i < length; i++) value.push(this.getFloat32());
        return value;
    }

    getFloat32AsByte(): number {
        const value = this.view.getFloat32(this.offset);
        this.offset += 4;
        return Math.round(value * 255);
    }

    getFloat32ArrayAsBytes(length: number): number[] {
        const value = [];
        for (let i = 0; i < length; i++) value.push(this.getFloat32AsByte());
        return value;
    }
}

function readColor(view: DataViewWrapper): chroma.Color {
    const mode = String.fromCharCode(...view.getUint8Array(4)).trim();

    switch (mode) {
        case "RGB":
            return chroma.rgb(...view.getFloat32ArrayAsBytes(3) as [number, number, number]);
        case "CMYK":
            return chroma.cmyk(...view.getFloat32ArrayAsBytes(4) as [number, number, number, number]);
        case "LAB":
            return chroma.lab(...view.getFloat32Array(3) as [number, number, number]);
        default:
            throw new Error(`Unknown color mode: ${mode}`);
    }
}

export function parseAse(buffer: ArrayBuffer): AseEntry[] {
    const view = new DataViewWrapper(buffer);

    // Check Signature: "ASEF"
    const sig = String.fromCharCode(view.getUint8(), view.getUint8(), view.getUint8(), view.getUint8());
    if (sig !== 'ASEF') throw new Error('Not a valid ASE file');

    view.skip(8); // Skip header and version info
    const colors: AseEntry[] = [];

    while (!view.done()) {
        const blockType = view.getUint16();
        const blockLength = view.getUint32();
        const startOffset = view.offset;


        if (blockType === 0x01 || blockType === 0x0001) { // Color Block
            const nameLen = view.getUint16();
            let name = "";
            for (let i = 0; i < nameLen - 1; i++) {
                name += String.fromCharCode(view.getUint16());
            }
            view.skip(2); // Skip null terminator

            const color = readColor(view);
            const type = view.getUint16();

            colors.push({
                name,
                color,
                type,
            });
            if (view.offset != startOffset + blockLength) {
                throw new Error(`Block length mismatch. startOffset: ${startOffset}, blockLength: ${blockLength}, view.offset: ${view.offset}, color: ${name}`);
            }
        } else {
            view.skip(blockLength);
        }
    }
    return colors;
}