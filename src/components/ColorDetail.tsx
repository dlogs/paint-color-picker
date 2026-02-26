import { useMemo, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router';
import { initColorSearch, findClosestColor } from '../util/similarity';
import type { Swatch } from '@/types/swatch';
import type { RelationshipMatch } from '@/types/relationships';
import SwatchCard from './SwatchCard';
import { AddToPaletteDialog } from './AddToPaletteDialog';
import { HuePill } from './HuePill';
import { cn } from '@/lib/utils';

interface ColorDetailProps {
    allColors: Swatch[];
    onAccentChange: (color: string | null, isDark: boolean) => void;
}

const StatBlock = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
        <p className="opacity-50 uppercase text-[10px] sm:text-xs tracking-widest sm:tracking-[0.25em] font-black mb-2 sm:mb-3">{label}</p>
        <div className="text-3xl sm:text-4xl font-mono font-black leading-none">{children}</div>
    </div>
);

const ColorDetail = ({ allColors, onAccentChange }: ColorDetailProps) => {
    const { colorId } = useParams<{ colorId: string }>();
    const navigate = useNavigate();
    const [isOramaReady, setIsOramaReady] = useState(false);
    const [activeRel, setActiveRel] = useState<{
        dim: 'L' | 'C' | 'H',
        dir: 'above' | 'below',
        label: string
    }>({ dim: 'H', dir: 'below', label: 'Warmer' });
    const [matches, setMatches] = useState<RelationshipMatch[]>([]);
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
        direction: 'above' | 'below',
        limit: number = 10
    ): Promise<RelationshipMatch[]> => {
        if (!color || !isOramaReady) return [];
        const [L, C, H] = color.oklch;
        const results: RelationshipMatch[] = [];
        const seenIds = new Set<string>([color.id]);

        const increments = {
            L: 0.03,
            C: 0.02,
            H: 5
        };

        // Increase search depth to find more results
        for (let i = 1; i <= limit * 6; i++) {
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

            if (results.length >= limit) break;
        }

        return results;
    };

    useEffect(() => {
        const fetchMatches = async () => {
            if (!color || !isOramaReady) return;
            setIsSearching(true);
            const res = await getIncrementalColors(activeRel.dim, activeRel.dir, 10);
            setMatches(res);
            setIsSearching(false);
        };
        fetchMatches();
    }, [color, isOramaReady, activeRel]);



    const similarUrl = useMemo(() => {
        if (!color) return '/';
        const [L, C, H] = color.oklch;
        const hLo = (H - 10 + 360) % 360;
        const hHi = (H + 10 + 360) % 360;
        const cLo = Math.max(0, C - 0.02);
        const cHi = C + 0.02;
        const lLo = Math.max(0, L - 0.05);
        const lHi = Math.min(1, L + 0.05);

        return `/?hLo=${hLo.toFixed(2)}&hHi=${hHi.toFixed(2)}&cLo=${cLo.toFixed(4)}&cHi=${cHi.toFixed(4)}&lLo=${lLo.toFixed(4)}&lHi=${lHi.toFixed(4)}`;
    }, [color]);

    // Move hooks before early return to satisfy Rules of Hooks
    const [L, C, H] = color?.oklch ?? [0, 0, 0];

    useEffect(() => {
        if (!color) return;
        onAccentChange(`rgb(${color.rgb.join(',')})`, L < 0.6);
        return () => onAccentChange(null, false);
    }, [color, onAccentChange, L]);

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


    const isDark = L < 0.6;
    const textColor = isDark ? 'text-white' : 'text-black';
    const borderColor = isDark ? 'border-white/20' : 'border-black/10';

    return (
        <div className={`w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 ${textColor}`}>
            <div className="flex items-center justify-between mb-8">
                <Link to="/">
                    <Button
                        variant={isDark ? "adaptiveLight" : "adaptiveDark"}
                        className="rounded-full px-6 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Library
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <Link to={similarUrl}>
                        <Button
                            variant={isDark ? "adaptiveLight" : "adaptiveDark"}
                            className="rounded-full px-4 sm:px-6 font-bold transition-all"
                        >
                            <Search className="w-4 h-4 mr-2" /> Find Similar
                        </Button>
                    </Link>
                    <AddToPaletteDialog
                        swatch={color}
                        hasAccent={true}
                        isDarkAccent={isDark}
                    />
                </div>
            </div>

            <div className="w-full max-w-2xl mb-12 sm:mb-20 pt-4 sm:pt-8 relative z-10">
                <h1 className="text-4xl sm:text-6xl font-black mb-3 sm:mb-4 tracking-tighter flex flex-wrap items-center gap-3">
                    <span>{color.name}</span>
                    {color.number && <span className="opacity-50 font-medium text-2xl sm:text-4xl whitespace-nowrap">({color.number})</span>}
                </h1>
                <p className="text-base sm:text-lg opacity-90 font-bold mb-8 sm:mb-12 flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1.5 bg-black/10 rounded-full text-xs sm:text-sm uppercase tracking-widest leading-none border border-black/5 shadow-inner">
                        {color.brand}
                    </span>
                    <span className="opacity-30 mx-1">/</span>
                    <span className="opacity-80">{color.collection}</span>
                </p>
                <div className={`grid grid-cols-3 gap-4 sm:gap-10 pt-8 sm:pt-10 border-t ${borderColor}`}>
                    <StatBlock label="Lightness">
                        {Math.round(L * 100)}%
                    </StatBlock>
                    <StatBlock label="Chroma">
                        {C.toFixed(3)}
                    </StatBlock>
                    <StatBlock label="Hue">
                        <HuePill
                            hue={H}
                            className="px-4 py-1.5 sm:py-2 text-2xl sm:text-3xl shadow-lg border-white/20"
                        />
                    </StatBlock>
                </div>
            </div>

            <div className="space-y-12">
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {[
                        { dim: 'H', dir: 'below', label: 'Warmer' },
                        { dim: 'H', dir: 'above', label: 'Cooler' },
                        { dim: 'C', dir: 'above', label: 'More Vibrant' },
                        { dim: 'C', dir: 'below', label: 'Less Vibrant' },
                        { dim: 'L', dir: 'above', label: 'Lighter' },
                        { dim: 'L', dir: 'below', label: 'Darker' },
                    ].map((rel) => (
                        <Button
                            key={`${rel.dim}-${rel.dir}`}
                            variant={isDark ? "adaptiveLight" : "adaptiveDark"}
                            onClick={() => setActiveRel(rel as any)}
                            className={cn(
                                "rounded-full px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-bold transition-all duration-300 shadow-xl",
                                activeRel.dim === rel.dim && activeRel.dir === rel.dir
                                    ? [
                                        "scale-105",
                                        isDark ? "bg-white text-black hover:bg-white" : "bg-black text-white hover:bg-black"
                                    ]
                                    : "hover:-translate-y-1"
                            )}
                        >
                            {rel.label}
                        </Button>
                    ))}
                </div>

                <div className="relative overflow-hidden pt-8">
                    {isSearching && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-10 animate-in fade-in duration-300 rounded-3xl">
                            <Loader2 className={`w-12 h-12 animate-spin ${textColor}`} />
                        </div>
                    )}

                    {matches.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {matches.map((m) => (
                                <SwatchCard
                                    key={m.swatch.id}
                                    swatch={m.swatch}
                                    targetOklch={m.targetOklch}
                                    activeDimension={activeRel.dim}
                                    mainColor={color}
                                />
                            ))}
                        </div>
                    ) : (
                        !isSearching && (
                            <div className={`py-24 text-center border-2 border-dashed rounded-3xl ${borderColor}`}>
                                <p className="opacity-70 font-medium italic">No matches found for this criteria.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ColorDetail;
