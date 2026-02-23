import React, { useMemo, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { initColorSearch, findClosestColor } from '../util/similarity';
import type { Swatch } from '@/services/swatch-assets';

interface ColorDetailProps {
    allColors: Swatch[];
}

const ColorDetail: React.FC<ColorDetailProps> = ({ allColors }) => {
    const { colorId } = useParams<{ colorId: string }>();
    const navigate = useNavigate();
    const [isOramaReady, setIsOramaReady] = useState(false);
    const [relationships, setRelationships] = useState<{
        hue: { above: Swatch[], below: Swatch[] },
        chroma: { above: Swatch[], below: Swatch[] },
        lightness: { above: Swatch[], below: Swatch[] }
    }>({
        hue: { above: [], below: [] },
        chroma: { above: [], below: [] },
        lightness: { above: [], below: [] }
    });
    const [isSearching, setIsSearching] = useState(false);

    const color = useMemo(() => allColors.find(c => c.id === colorId), [allColors, colorId]);

    useEffect(() => {
        const init = async () => {
            if (allColors.length > 0) {
                await initColorSearch(allColors);
                setIsOramaReady(true);
            }
        };
        init();
    }, [allColors]);

    const getIncrementalColors = async (
        dimension: 'L' | 'C' | 'H',
        direction: 'above' | 'below'
    ) => {
        if (!color || !isOramaReady) return [];
        const [L, C, H] = color.oklch;
        const results: Swatch[] = [];
        const seenIds = new Set<string>([color.id]);

        const steps = 5;
        const increments = {
            L: 0.05,
            C: 0.03,
            H: 15
        };

        for (let i = 1; i <= steps * 3; i++) { // Search further to find unique colors
            let targetL = L;
            let targetC = C;
            let targetH = H;

            const delta = increments[dimension] * i;
            const sign = direction === 'above' ? 1 : -1;

            if (dimension === 'L') {
                targetL = Math.max(0.01, Math.min(0.99, L + sign * delta));
            } else if (dimension === 'C') {
                targetC = Math.max(0, Math.min(0.4, C + sign * delta));
            } else {
                targetH = (H + sign * delta + 360) % 360;
            }

            const closest = await findClosestColor([targetL, targetC, targetH], color.id);
            if (closest && !seenIds.has(closest.id)) {
                results.push(closest);
                seenIds.add(closest.id);
            }

            if (results.length >= steps) break;
        }

        return results;
    };

    useEffect(() => {
        const fetchRelationships = async () => {
            if (!color || !isOramaReady) return;
            setIsSearching(true);

            const [
                hueAbove, hueBelow,
                chromaAbove, chromaBelow,
                lightnessAbove, lightnessBelow
            ] = await Promise.all([
                getIncrementalColors('H', 'above'),
                getIncrementalColors('H', 'below'),
                getIncrementalColors('C', 'above'),
                getIncrementalColors('C', 'below'),
                getIncrementalColors('L', 'above'),
                getIncrementalColors('L', 'below')
            ]);

            setRelationships({
                hue: { above: hueAbove, below: hueBelow },
                chroma: { above: chromaAbove, below: chromaBelow },
                lightness: { above: lightnessAbove, below: lightnessBelow }
            });
            setIsSearching(false);
        };
        fetchRelationships();
    }, [color, isOramaReady]);

    if (!color) {
        return (
            <div className="flex flex-col items-center justify-center p-24 bg-muted/50 rounded-3xl border-2 border-dashed border-muted">
                <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Color not found</h2>
                <p className="text-muted-foreground mb-8">This color may have been removed or the ID is invalid.</p>
                <Button onClick={() => navigate('/')}>Back to Library</Button>
            </div>
        );
    }

    const [L, C, H] = color.oklch;

    const ColorGrid = ({ title, colorsAbove, colorsBelow, loading }: { title: string, colorsAbove: Swatch[], colorsBelow: Swatch[], loading?: boolean }) => (
        <div className="bg-card rounded-2xl border p-6 space-y-6 relative overflow-hidden">
            {loading && (
                <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground text-center border-b border-border/50 pb-4">{title}</h3>
            <div className="space-y-6">
                <div>
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest mb-3 opacity-50">Higher Value</p>
                    <div className="grid grid-cols-1 gap-2">
                        {colorsAbove.length > 0 ? colorsAbove.map(c => (
                            <Link
                                key={c.id}
                                to={`/color/${c.id}`}
                                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border"
                            >
                                <div
                                    className="w-12 h-12 rounded-lg shadow-sm flex-shrink-0 border border-white/10"
                                    style={{ backgroundColor: `oklch(${c.oklch[0] * 100}% ${c.oklch[1]} ${c.oklch[2]})` }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate text-foreground leading-tight">{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{c.brand}</p>
                                </div>
                            </Link>
                        )) : !loading && <p className="text-[10px] text-center text-muted-foreground italic">No colors found</p>}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-px bg-border/50 flex-1" />
                    <div className="w-1.5 h-1.5 rounded-full bg-border" />
                    <div className="h-px bg-border/50 flex-1" />
                </div>

                <div>
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest mb-3 opacity-50">Lower Value</p>
                    <div className="grid grid-cols-1 gap-2">
                        {colorsBelow.length > 0 ? colorsBelow.map(c => (
                            <Link
                                key={c.id}
                                to={`/color/${c.id}`}
                                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border"
                            >
                                <div
                                    className="w-12 h-12 rounded-lg shadow-sm flex-shrink-0 border border-white/10"
                                    style={{ backgroundColor: `oklch(${c.oklch[0] * 100}% ${c.oklch[1]} ${c.oklch[2]})` }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate text-foreground leading-tight">{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{c.brand}</p>
                                </div>
                            </Link>
                        )) : !loading && <p className="text-[10px] text-center text-muted-foreground italic">No colors found</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <Link to="/">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
                    </Button>
                </Link>
            </div>

            <div className="bg-card rounded-3xl border shadow-2xl overflow-hidden mb-12">
                <div
                    className="h-96 relative flex items-end p-12 transition-colors duration-500"
                    style={{ backgroundColor: `oklch(${L * 100}% ${C} ${H})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="bg-background/40 backdrop-blur-xl p-8 rounded-2xl border border-white/20 shadow-2xl max-w-lg relative z-10">
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">{color.name}</h1>
                        <p className="text-base opacity-90 font-medium mb-6">{color.brand} <span className="mx-2 opacity-50">•</span> {color.collection}</p>
                        <div className="grid grid-cols-3 gap-8 pt-6 border-t border-white/10">
                            <div>
                                <p className="opacity-60 uppercase text-[10px] tracking-widest font-bold mb-2">Lightness</p>
                                <p className="text-xl font-mono font-bold leading-none">{Math.round(L * 100)}%</p>
                            </div>
                            <div>
                                <p className="opacity-60 uppercase text-[10px] tracking-widest font-bold mb-2">Chroma</p>
                                <p className="text-xl font-mono font-bold leading-none">{C.toFixed(3)}</p>
                            </div>
                            <div>
                                <p className="opacity-60 uppercase text-[10px] tracking-widest font-bold mb-2">Hue</p>
                                <p className="text-xl font-mono font-bold leading-none">{Math.round(H)}°</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ColorGrid title="Hue Relationship" colorsAbove={relationships.hue.above} colorsBelow={relationships.hue.below} loading={isSearching} />
                <ColorGrid title="Chroma Relationship" colorsAbove={relationships.chroma.above} colorsBelow={relationships.chroma.below} loading={isSearching} />
                <ColorGrid title="Lightness Relationship" colorsAbove={relationships.lightness.above} colorsBelow={relationships.lightness.below} loading={isSearching} />
            </div>
        </div>
    );
};

export default ColorDetail;
