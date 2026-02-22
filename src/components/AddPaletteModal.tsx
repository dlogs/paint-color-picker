import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import AseUploader from './AseUploader';
import { type AseColor } from '@/util/ase-parser';

interface AddPaletteModalProps {
    onPalettesAdded: (colors: AseColor[]) => void;
}

const AddPaletteModal: React.FC<AddPaletteModalProps> = ({ onPalettesAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [brand, setBrand] = useState('');
    const [collection, setCollection] = useState('');
    const [tempColors, setTempColors] = useState<AseColor[]>([]);

    const handlePaletteLoaded = (colors: AseColor[]) => {
        // We add the brand and collection to the individual colors if not already set
        const processedColors = colors.map(c => ({
            ...c,
            brand: brand || 'Unknown',
            collection: collection || 'General'
        }));
        setTempColors(prev => [...prev, ...processedColors]);
    };

    const handleSave = () => {
        onPalettesAdded(tempColors);
        setTempColors([]);
        setBrand('');
        setCollection('');
        setIsOpen(false);
    };

    const handleClear = () => {
        setTempColors([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                    <Plus className="w-4 h-4" /> Add New Palette
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-width-[500px] bg-slate-900 text-white border-slate-700">
                <DialogHeader>
                    <DialogTitle>Add New Color Palette</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="brand" className="text-right">
                            Brand
                        </Label>
                        <Input
                            id="brand"
                            placeholder="e.g. Benjamin Moore"
                            className="col-span-3 bg-slate-800 border-slate-700"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="collection" className="text-right">
                            Collection
                        </Label>
                        <Input
                            id="collection"
                            placeholder="e.g. Aura 2024"
                            className="col-span-3 bg-slate-800 border-slate-700"
                            value={collection}
                            onChange={(e) => setCollection(e.target.value)}
                        />
                    </div>

                    <div className="mt-4">
                        <Label className="mb-2 block">Upload .ase files</Label>
                        <AseUploader
                            onPaletteLoaded={(palette) => handlePaletteLoaded(palette.colors)}
                            onError={(err) => alert(err)}
                        />
                    </div>

                    {tempColors.length > 0 && (
                        <div className="text-sm text-slate-400">
                            {tempColors.length} colors queued for addition.
                            <Button variant="ghost" size="sm" onClick={handleClear} className="ml-2 text-red-400">Clear</Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="border-slate-700 hover:bg-slate-800">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={tempColors.length === 0}>
                        Save Palettes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddPaletteModal;
