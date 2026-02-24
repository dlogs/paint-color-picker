import { useMemo, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { initColorSearch, findClosestColor } from '../util/similarity';
import type { Swatch } from '@/types/swatch';
import type { RelationshipMatch } from '@/types/relationships';
import ColorGrid from './ColorGrid';


interface ColorDetailProps {
    allColors: Swatch[];
}

const ColorDetail = ({ allColors }: ColorDetailProps) => {
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
                        <h1 className="text-5xl font-black mb-3 tracking-tighter text-foreground">
                            {color.name}
                            {color.number && <span className="ml-3 opacity-50 font-medium whitespace-nowrap">({color.number})</span>}
                        </h1>
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
                                <div
                                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-2xl font-mono font-black text-white shadow-lg border border-white/20 whitespace-nowrap"
                                    style={{
                                        backgroundColor: `oklch(70% 0.2 ${Math.round(H)})`,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                                    }}
                                >
                                    {Math.round(H)}°
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <ColorGrid
                    title="Hue Relationship"
                    matchesAbove={relationships.hue.above}
                    matchesBelow={relationships.hue.below}
                    loading={isSearching}
                    dimension="H"
                    mainColor={color}
                />
                <ColorGrid
                    title="Chroma Relationship"
                    matchesAbove={relationships.chroma.above}
                    matchesBelow={relationships.chroma.below}
                    loading={isSearching}
                    dimension="C"
                    mainColor={color}
                />
                <ColorGrid
                    title="Lightness Relationship"
                    matchesAbove={relationships.lightness.above}
                    matchesBelow={relationships.lightness.below}
                    loading={isSearching}
                    dimension="L"
                    mainColor={color}
                />
            </div>
        </div>
    );
};

export default ColorDetail;
