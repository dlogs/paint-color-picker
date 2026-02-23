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
import { BrandCombobox } from './BrandCombobox';
import type { Swatch } from '@/services/swatch-assets';
import type { AseEntry } from '@/util/ase-parser';
import { nanoid } from 'nanoid';

interface AddPaletteModalProps {
    onPalettesAdded: (colors: Swatch[]) => void;
}

const AddPaletteModal: React.FC<AddPaletteModalProps> = ({ onPalettesAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [brand, setBrand] = useState('');
    const [collection, setCollection] = useState('');
    const [tempColors, setTempColors] = useState<Swatch[]>([]);

    const handlePaletteLoaded = (colors: AseEntry[]) => {
        // We add the brand and collection to the individual colors if not already set
        const processedColors: Swatch[] = colors.map(c => ({
            id: nanoid(),
            name: c.name,
            rgb: c.color.rgb(),
            oklch: c.color.oklch(),
            oklab: c.color.oklab(),
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
            <DialogContent className="sm:max-width-[500px] bg-popover text-popover-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Add New Color Palette</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="brand" className="text-right">
                            Brand
                        </Label>
                        <BrandCombobox
                            value={brand}
                            onChange={setBrand}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="collection" className="text-right">
                            Collection
                        </Label>
                        <Input
                            id="collection"
                            placeholder="e.g. Aura 2024"
                            className="col-span-3 bg-background border-input"
                            value={collection}
                            onChange={(e) => setCollection(e.target.value)}
                        />
                    </div>

                    <div className="mt-4">
                        <Label className="mb-2 block">Upload .ase files</Label>
                        <AseUploader
                            onPaletteLoaded={(palette) => handlePaletteLoaded(palette)}
                            onError={(err) => alert(err)}
                        />
                    </div>

                    {tempColors.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            {tempColors.length} colors queued for addition.
                            <Button variant="ghost" size="sm" onClick={handleClear} className="ml-2 text-destructive">Clear</Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="border-border hover:bg-muted">
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
