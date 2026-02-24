import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getPalettes, deletePalette } from '../services/palette-storage';
import { Button } from './ui/button';
import { Trash2, Palette as PaletteIcon, ChevronRight } from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';
import type { Palette } from '../types/palette';
import type { Swatch } from '../types/swatch';

interface PaletteListProps {
    allColors: Swatch[];
}

export default function PaletteList({ allColors }: PaletteListProps) {
    const [palettes, setPalettes] = useState<Palette[]>([]);

    useEffect(() => {
        setPalettes(getPalettes());
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this palette?')) {
            deletePalette(id);
            setPalettes(getPalettes());
        }
    };

    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <PaletteIcon className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">You haven't created any palettes.</p>
        <div className="mt-6 flex flex-col w-full gap-2">
            <SheetClose asChild>
                <Button variant="outline" className="w-full">
                    Browse Library
                </Button>
            </SheetClose>
        </div>
    </div>

    return (
        <div className="space-y-4 animate-fade-in w-full pb-12">
            <div className="flex flex-col gap-4">
                {palettes.map((palette) => {
                    // Preview up to 5 colors
                    const previewColors = palette.swatches
                        .map(id => allColors.find(c => c.id === id))
                        .filter((c): c is Swatch => c !== undefined)
                        .slice(0, 5);

                    return (
                        <SheetClose asChild key={palette.id}>
                            <Link
                                to={`/palette/${palette.id}`}
                                className="group block relative p-4 bg-card rounded-xl border border-border/50 hover:border-primary/50 shadow-sm transition-all hover:shadow-md"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{palette.name}</h3>
                                        <p className="text-sm text-muted-foreground">{palette.swatches.length} Colors</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive shrink-0 -mt-2 -mr-2"
                                        onClick={(e) => handleDelete(palette.id, e)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="flex h-12 rounded-md overflow-hidden bg-muted/30">
                                    {previewColors.length > 0 ? (
                                        previewColors.map((color, i) => (
                                            <div
                                                key={`${color.id}-${i}`}
                                                className="h-full flex-1"
                                                style={{ backgroundColor: `rgb(${color.rgb.join(',')})` }}
                                            />
                                        ))
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground opacity-50 uppercase tracking-widest font-bold">
                                            Empty Palette
                                        </div>
                                    )}
                                    {palette.swatches.length > 5 && (
                                        <div className="h-full flex-none w-10 bg-muted flex items-center justify-center text-xs font-bold border-l border-background/20">
                                            +{palette.swatches.length - 5}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 flex items-center text-xs font-semibold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                                    View & Compare
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </div>
                            </Link>
                        </SheetClose>
                    );
                })}
            </div>

            <SheetClose asChild>
                <Button variant="outline" className="w-full mt-4">
                    Back to Library
                </Button>
            </SheetClose>
        </div>
    );
}
