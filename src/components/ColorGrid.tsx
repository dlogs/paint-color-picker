import { Loader2 } from 'lucide-react';
import SwatchCard from './SwatchCard';
import type { Swatch } from '@/types/swatch';
import type { RelationshipMatch } from '@/types/relationships';

interface ColorGridProps {
    title: string;
    matchesAbove: RelationshipMatch[];
    matchesBelow: RelationshipMatch[];
    loading?: boolean;
    dimension: 'L' | 'C' | 'H';
    mainColor: Swatch;
}

const ColorGrid = ({
    title,
    matchesAbove,
    matchesBelow,
    loading,
    dimension,
    mainColor
}: ColorGridProps) => (
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
                        <SwatchCard
                            key={m.swatch.id}
                            swatch={m.swatch}
                            targetOklch={m.targetOklch}
                            activeDimension={dimension}
                            mainColor={mainColor}
                        />
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
                        <SwatchCard
                            key={m.swatch.id}
                            swatch={m.swatch}
                            targetOklch={m.targetOklch}
                            activeDimension={dimension}
                            mainColor={mainColor}
                        />
                    )) : !loading && <p className="text-[10px] text-center text-muted-foreground italic py-8 border border-dashed rounded-xl opacity-50">Limit reached</p>}
                </div>
            </div>
        </div>
    </div>
);

export default ColorGrid;
