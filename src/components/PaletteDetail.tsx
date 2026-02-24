import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { getPalettes, removeSwatchFromPalette, moveSwatchInPalette } from '../services/palette-storage';
import type { Palette } from '../types/palette';
import type { Swatch } from '../types/swatch';

interface PaletteDetailProps {
    allColors: Swatch[];
}

export default function PaletteDetail({ allColors }: PaletteDetailProps) {
    const { paletteId } = useParams<{ paletteId: string }>();
    const navigate = useNavigate();
    const [palette, setPalette] = useState<Palette | null>(null);

    const loadPalette = () => {
        const palettes = getPalettes();
        const found = palettes.find(p => p.id === paletteId);
        if (!found) {
            navigate('/palettes', { replace: true });
        } else {
            setPalette(found);
        }
    };

    useEffect(() => {
        loadPalette();
    }, [paletteId, navigate]);

    if (!palette) return null;

    const paletteColors = palette.swatches
        .map(id => allColors.find(c => c.id === id))
        .filter((c): c is Swatch => c !== undefined);

    const handleRemove = (swatchId: string) => {
        if (confirm('Remove this color from the palette?')) {
            removeSwatchFromPalette(palette.id, swatchId);
            loadPalette();
        }
    };

    const handleMove = (swatchId: string, direction: 'left' | 'right') => {
        moveSwatchInPalette(palette.id, swatchId, direction);
        loadPalette();
    };

    return (
        <div className="space-y-6 animate-fade-in w-full max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link to="/palettes">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{palette.name}</h1>
                    <p className="text-muted-foreground">{paletteColors.length} Colors</p>
                </div>
            </div>

            {paletteColors.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-24 bg-card rounded-3xl border-2 border-dashed border-muted text-center">
                    <div className="text-6xl mb-4 opacity-20">🎨</div>
                    <h2 className="text-2xl font-semibold mb-2">Palette is Empty</h2>
                    <p className="text-muted-foreground mb-8">
                        Add colors from the main library to compare them side-by-side.
                    </p>
                    <Button asChild>
                        <Link to="/">Browse Library</Link>
                    </Button>
                </div>
            ) : (
                <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6 overflow-hidden">
                    {/* Compare View - Side By Side Columns (Desktop) / Vertical Stack (Mobile) */}
                    <div className="flex flex-col md:flex-row h-auto md:h-[60vh] min-h-[500px] rounded-lg overflow-hidden border">
                        {paletteColors.map((color, index) => {
                            const contrastText = color.oklch[0] < 0.6 ? 'text-white' : 'text-black';
                            const contrastMuted = color.oklch[0] < 0.6 ? 'text-white/70' : 'text-black/70';
                            const contrastBorder = color.oklch[0] < 0.6 ? 'border-white/10' : 'border-black/10';

                            return (
                                <div
                                    key={color.id}
                                    className="flex-1 min-h-[250px] md:min-h-0 flex flex-col group relative overflow-hidden transition-all duration-300 md:hover:flex-[1.2] border-b md:border-b-0 md:border-r border-background/20 last:border-0"
                                    style={{ backgroundColor: `rgb(${color.rgb.join(',')})` }}
                                >
                                    <div className="absolute top-4 left-4 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {index > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleMove(color.id, 'left')}
                                                className={`hover:bg-black/10 focus:opacity-100 ${contrastText} w-8 h-8 rounded-full`}
                                                title="Move left/up"
                                            >
                                                <ChevronLeft className="hidden md:block w-5 h-5" />
                                                <ChevronUp className="md:hidden w-5 h-5" />
                                            </Button>
                                        )}
                                        {index < paletteColors.length - 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleMove(color.id, 'right')}
                                                className={`hover:bg-black/10 focus:opacity-100 ${contrastText} w-8 h-8 rounded-full`}
                                                title="Move right/down"
                                            >
                                                <ChevronRight className="hidden md:block w-5 h-5" />
                                                <ChevronDown className="md:hidden w-5 h-5" />
                                            </Button>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(color.id)}
                                        className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/10 focus:opacity-100 ${contrastText}`}
                                        title="Remove from palette"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    <div className={`mt-auto p-6 flex flex-col items-center text-center bg-gradient-to-t from-black/20 to-transparent pt-12 ${contrastText}`}>
                                        <span className={`text-xs font-mono mb-2 px-2 py-1 rounded bg-black/10 backdrop-blur-sm ${contrastBorder}`}>
                                            {color.number}
                                        </span>
                                        <h2 className="text-2xl font-bold mb-1 leading-tight">{color.name}</h2>
                                        <p className={`text-xs uppercase tracking-widest font-bold ${contrastMuted}`}>
                                            {color.brand}
                                        </p>

                                        {/* Stats */}
                                        <div className={`grid grid-cols-3 gap-4 w-full mt-6 pt-4 border-t ${contrastBorder} text-sm`}>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${contrastMuted}`}>Light</span>
                                                <span className="font-mono">{color.oklch[0].toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${contrastMuted}`}>Chroma</span>
                                                <span className="font-mono">{color.oklch[1].toFixed(3)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${contrastMuted}`}>Hue</span>
                                                <span className="font-mono">{Math.round(color.oklch[2])}°</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button asChild variant="outline" className="bg-background/20 backdrop-blur hover:bg-background/40 border-0">
                                                <Link to={`/color/${color.id}`}>View Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
