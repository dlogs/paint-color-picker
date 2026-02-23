import React, { useMemo, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { initColorSearch, findClosestColor } from '../util/similarity';
import type { Swatch } from '@/services/swatch-assets';
import chroma from 'chroma-js';

interface RelationshipMatch {
    swatch: Swatch;
    targetOklch: [number, number, number];
}

interface ColorDetailProps {
    allColors: Swatch[];
}

const ColorDetail: React.FC<ColorDetailProps> = ({ allColors }) => {
    const { colorId } = useParams<{ colorId: string }>();
    const navigate = useNavigate();
    const [isOramaReady, setIsOramaReady] = useState(false);
    const [relationships, setRelationships] = useState<{
        hue: { above: RelationshipMatch[], below: RelationshipMatch[] },
        chroma: { above: RelationshipMatch[], below: RelationshipMatch[] },
        lightness: { above: RelationshipMatch[], below: RelationshipMatch[] }
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
    ): Promise<RelationshipMatch[]> => {
        if (!color || !isOramaReady) return [];
        const [L, C, H] = color.oklch;
        const results: RelationshipMatch[] = [];
        const seenIds = new Set<string>([color.id]);

        const steps = 5;
        const increments = {
            L: 0.05,
            C: 0.03,
            H: 15
        };

        for (let i = 1; i <= steps * 4; i++) { // Search further to find unique colors
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
                results.push({
                    swatch: closest,
                    targetOklch: [targetL, targetC, targetH]
                });
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

    const SwatchCard = ({ match }: { match: RelationshipMatch }) => {
        const { swatch, targetOklch } = match;
        const [sL, sC, sH] = swatch.oklch;
        const [tL, tC, tH] = targetOklch;

        // Calculate Delta-E proxy (Euclidean distance in OKLab)
        const targetOklab = chroma.oklch(tL, tC, tH).oklab();
        const delta = Math.sqrt(
            Math.pow(swatch.oklab[0] - targetOklab[0], 2) +
            Math.pow(swatch.oklab[1] - targetOklab[1], 2) +
            Math.pow(swatch.oklab[2] - targetOklab[2], 2)
        ) * 100;

        const isDark = sL < 0.6;
        const textColor = isDark ? 'text-white' : 'text-black';
        const subTextColor = isDark ? 'text-white/60' : 'text-black/50';

        return (
            <Link
                to={`/color/${swatch.id}`}
                className="group relative flex flex-col p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl border border-white/10 overflow-hidden"
                style={{ backgroundColor: `rgb(${swatch.rgb.join(',')})` }}
            >
                {/* Background brightness overlay for contrast */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${isDark ? 'bg-white' : 'bg-black'}`} />

                <div className="relative flex justify-between items-start mb-6">
                    <div className="min-w-0">
                        <p className={`text-xs font-black truncate tracking-tight ${textColor}`}>{swatch.name}</p>
                        <p className={`text-[10px] font-bold opacity-70 truncate uppercase tracking-widest ${subTextColor}`}>{swatch.brand}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <p className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/10 backdrop-blur-md border border-white/10 ${textColor}`}>
                            ΔE {delta.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="relative mt-auto grid grid-cols-3 gap-2 py-3 border-t border-black/5 items-center">
                    <div>
                        <p className={`text-[8px] uppercase font-black tracking-widest leading-none mb-1 ${subTextColor}`}>L</p>
                        <p className={`text-xs font-mono font-black border-l border-white/20 pl-1.5 ${textColor}`}>{Math.round(sL * 100)}</p>
                    </div>
                    <div>
                        <p className={`text-[8px] uppercase font-black tracking-widest leading-none mb-1 ${subTextColor}`}>C</p>
                        <p className={`text-xs font-mono font-black border-l border-white/20 pl-1.5 ${textColor}`}>{sC.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className={`text-[8px] uppercase font-black tracking-widest leading-none mb-1 ${subTextColor}`}>H</p>
                        <p className={`text-xs font-mono font-black border-l border-white/20 pl-1.5 ${textColor}`}>{Math.round(sH)}°</p>
                    </div>
                </div>

                {/* Target Debug Info */}
                <div className="relative mt-2 p-2 rounded-xl bg-black/5 backdrop-blur-xl border border-white/5 flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                        <p className={`text-[7px] font-black uppercase tracking-widest opacity-40 ${textColor}`}>Search Target</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner"
                                style={{ backgroundColor: `oklch(${tL * 100}% ${tC} ${tH})` }}
                            />
                            <p className={`text-[9px] font-mono font-bold tracking-tight ${textColor}`}>
                                {Math.round(tL * 100)}% · {tC.toFixed(2)} · {Math.round(tH)}°
                            </p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    const ColorGrid = ({ title, matchesAbove, matchesBelow, loading }: { title: string, matchesAbove: RelationshipMatch[], matchesBelow: RelationshipMatch[], loading?: boolean }) => (
        <div className="bg-card rounded-2xl border p-6 space-y-6 relative overflow-hidden shadow-sm">
            {loading && (
                <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground text-center border-b border-border/50 pb-4">{title}</h3>
            <div className="space-y-8">
                <div>
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.2em] mb-4 opacity-70 font-black">Higher Intensity</p>
                    <div className="grid grid-cols-1 gap-4">
                        {matchesAbove.length > 0 ? matchesAbove.map(m => (
                            <SwatchCard key={m.swatch.id} match={m} />
                        )) : !loading && <p className="text-[10px] text-center text-muted-foreground italic py-8 border border-dashed rounded-xl opacity-50">Limit reached</p>}
                    </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1 opacity-50" />
                    <div className="w-2 h-2 rounded-full border-2 border-border" />
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1 opacity-50" />
                </div>

                <div>
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.2em] mb-4 opacity-70 font-black">Lower Intensity</p>
                    <div className="grid grid-cols-1 gap-4">
                        {matchesBelow.length > 0 ? matchesBelow.map(m => (
                            <SwatchCard key={m.swatch.id} match={m} />
                        )) : !loading && <p className="text-[10px] text-center text-muted-foreground italic py-8 border border-dashed rounded-xl opacity-50">Limit reached</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center justify-between mb-8">
                <Link to="/">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Library
                    </Button>
                </Link>
            </div>

            <div className="bg-card rounded-3xl border shadow-2xl overflow-hidden mb-16 ring-1 ring-border/50">
                <div
                    className="h-96 relative flex items-end p-12 transition-colors duration-500"
                    style={{ backgroundColor: `rgb(${color.rgb.join(',')})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="bg-background/40 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl max-w-xl relative z-10 ring-1 ring-black/5">
                        <h1 className="text-5xl font-black mb-3 tracking-tighter text-foreground">{color.name}</h1>
                        <p className="text-lg opacity-90 font-bold mb-8 flex items-center gap-2">
                            <span className="px-3 py-1 bg-black/5 rounded-full text-xs uppercase tracking-widest">{color.brand}</span>
                            <span className="opacity-30">/</span>
                            <span className="text-muted-foreground">{color.collection}</span>
                        </p>
                        <div className="grid grid-cols-3 gap-10 pt-8 border-t border-white/10">
                            <div>
                                <p className="opacity-50 uppercase text-[10px] tracking-[0.25em] font-black mb-3 text-foreground">Lightness</p>
                                <p className="text-3xl font-mono font-black leading-none text-foreground">{Math.round(L * 100)}%</p>
                            </div>
                            <div>
                                <p className="opacity-50 uppercase text-[10px] tracking-[0.25em] font-black mb-3 text-foreground">Chroma</p>
                                <p className="text-3xl font-mono font-black leading-none text-foreground">{C.toFixed(3)}</p>
                            </div>
                            <div>
                                <p className="opacity-50 uppercase text-[10px] tracking-[0.25em] font-black mb-3 text-foreground">Hue</p>
                                <p className="text-3xl font-mono font-black leading-none text-foreground">{Math.round(H)}°</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <ColorGrid title="Hue Relationship" matchesAbove={relationships.hue.above} matchesBelow={relationships.hue.below} loading={isSearching} />
                <ColorGrid title="Chroma Relationship" matchesAbove={relationships.chroma.above} matchesBelow={relationships.chroma.below} loading={isSearching} />
                <ColorGrid title="Lightness Relationship" matchesAbove={relationships.lightness.above} matchesBelow={relationships.lightness.below} loading={isSearching} />
            </div>
        </div>
    );
};

export default ColorDetail;
