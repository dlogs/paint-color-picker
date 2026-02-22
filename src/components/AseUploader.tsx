import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { parseASE, type AseColor } from '../util/ase-parser';

export interface AsePalette {
    colors: AseColor[];
}

interface AseUploaderProps {
    onPaletteLoaded: (palette: AsePalette) => void;
    onError: (error: string) => void;
}

const AseUploader: React.FC<AseUploaderProps> = ({ onPaletteLoaded, onError }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const allColors: AseColor[] = [];

        for (const file of Array.from(files)) {
            if (!file.name.toLowerCase().endsWith('.ase')) {
                console.warn(`Skipping non-ase file: ${file.name}`);
                continue;
            }

            try {
                const result = await new Promise<ArrayBuffer>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });

                try {
                    const decoded = parseASE(result);
                    allColors.push(...decoded);
                } catch (decodeErr) {
                    console.error(`Decoding error for ${file.name}:`, decodeErr);
                }
            } catch (err) {
                console.error(`File reading error for ${file.name}:`, err);
            }
        }

        if (allColors.length > 0) {
            onPaletteLoaded({ colors: allColors });
        } else {
            onError('No valid colors found in the uploaded files.');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="uploader-container">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".ase"
                multiple
                style={{ display: 'none' }}
            />
            <div
                className="upload-zone p-6 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all text-center"
                onClick={handleButtonClick}
            >
                <div className="text-4xl mb-2">📁</div>
                <p className="text-sm text-slate-400">Click to upload <strong>.ase</strong> files</p>
                <Button variant="outline" size="sm" className="mt-4 border-slate-700">Select Files</Button>
            </div>
        </div>
    );
};

export default AseUploader;
