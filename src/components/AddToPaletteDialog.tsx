import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { getPalettes, createPalette, addSwatchToPalette } from '../services/palette-storage';
import type { Palette } from '../types/palette';
import type { Swatch } from '../types/swatch';
import { cn } from '@/lib/utils';

interface AddToPaletteDialogProps {
    swatch: Swatch;
    trigger?: React.ReactNode;
    hasAccent?: boolean;
    isDarkAccent?: boolean;
}

export function AddToPaletteDialog({ swatch, trigger, hasAccent, isDarkAccent }: AddToPaletteDialogProps) {
    const [open, setOpen] = useState(false);
    const [palettes, setPalettes] = useState<Palette[]>([]);
    const [selectedPaletteId, setSelectedPaletteId] = useState<string>('new');
    const [newPaletteName, setNewPaletteName] = useState('');

    const loadPalettes = useCallback(() => {
        setPalettes(getPalettes());
    }, []);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            loadPalettes();
            setSelectedPaletteId('new');
            setNewPaletteName('');
        }
    };

    const handleSave = () => {
        let targetPaletteId = selectedPaletteId;

        if (selectedPaletteId === 'new') {
            if (!newPaletteName.trim()) return;
            const newPalette = createPalette(newPaletteName.trim());
            targetPaletteId = newPalette.id;
        }

        addSwatchToPalette(targetPaletteId, swatch.id);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant={hasAccent ? "ghost" : "outline"}
                        size="sm"
                        className={cn(
                            "gap-2 rounded-full px-4 font-bold transition-all",
                            hasAccent
                                ? (isDarkAccent
                                    ? "bg-white/10 hover:bg-white/20 text-white border-0 shadow-none backdrop-blur-md"
                                    : "bg-black/5 hover:bg-black/10 text-black border-0 shadow-none backdrop-blur-md")
                                : ""
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        Add to Palette
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add to Palette</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
                    }}
                    className="flex flex-col gap-6 py-4"
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-lg border shadow-inner shrink-0"
                            style={{ backgroundColor: `rgb(${swatch.rgb.join(',')})` }}
                        />
                        <div>
                            <p className="font-semibold">{swatch.name}</p>
                            <p className="text-sm text-muted-foreground">{swatch.brand}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {palettes.length > 0 && (
                            <div className="space-y-2">
                                <Label>Select Palette</Label>
                                <Select value={selectedPaletteId} onValueChange={setSelectedPaletteId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a palette..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">-- Create New Palette --</SelectItem>
                                        {palettes.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} ({p.swatches.length} colors)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(selectedPaletteId === 'new' || palettes.length === 0) && (
                            <div className="space-y-2">
                                <Label htmlFor="name">New Palette Name</Label>
                                <Input
                                    id="name"
                                    value={newPaletteName}
                                    onChange={(e) => setNewPaletteName(e.target.value)}
                                    placeholder="e.g. Living Room, Exterior..."
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-2"
                        disabled={selectedPaletteId === 'new' && !newPaletteName.trim()}
                    >
                        Save to Palette
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
