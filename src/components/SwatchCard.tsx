import { Link } from 'react-router';
import chroma from 'chroma-js';
import { Plus } from 'lucide-react';
import type { Swatch } from '@/types/swatch';
import { AddToPaletteDialog } from './AddToPaletteDialog';
interface SwatchCardProps {
    swatch: Swatch;
    activeDimension?: 'L' | 'C' | 'H';
    mainColor?: Swatch;
    targetOklch?: [number, number, number];
}

const SwatchCard = ({ swatch, activeDimension, mainColor, targetOklch }: SwatchCardProps) => {
    const [sL, sC, sH] = swatch.oklch;

    // Delta-E to the MAIN color (if provided)
    const deltaToMain = mainColor ? Math.sqrt(
        Math.pow(swatch.oklab[0] - mainColor.oklab[0], 2) +
        Math.pow(swatch.oklab[1] - mainColor.oklab[1], 2) +
        Math.pow(swatch.oklab[2] - mainColor.oklab[2], 2)
    ) * 100 : null;

    // Delta-E to the SEARCH TARGET (if provided)
    const deltaToTarget = targetOklch ? (() => {
        const tL = targetOklch[0];
        const tC = targetOklch[1];
        const tH = targetOklch[2];
        const targetOklab = chroma.oklch(tL, tC, tH).oklab();
        return Math.sqrt(
            Math.pow(swatch.oklab[0] - targetOklab[0], 2) +
            Math.pow(swatch.oklab[1] - targetOklab[1], 2) +
            Math.pow(swatch.oklab[2] - targetOklab[2], 2)
        ) * 100;
    })() : null;

    const isDark = sL < 0.6;
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-white/60' : 'text-black/50';
    const borderColor = isDark ? 'border-white/20' : 'border-black/10';

    // Diff calculations relative to main color
    const diffL = mainColor ? Math.round((sL - mainColor.oklch[0]) * 100) : 0;
    const diffC = mainColor ? sC - mainColor.oklch[1] : 0;
    let diffH = mainColor ? Math.round(sH - mainColor.oklch[2]) : 0;
    if (diffH > 180) diffH -= 360;
    if (diffH < -180) diffH += 360;

    const formatDiff = (d: number, unit: string = '') => {
        if (d === 0 || !mainColor) return null;
        const sign = d > 0 ? '+' : '';
        return <span className="opacity-60 ml-1 text-[9px] font-bold">({sign}{d}{unit})</span>;
    };

    const formatDiffC = (d: number) => {
        if (Math.abs(d) < 0.001 || !mainColor) return null;
        const sign = d > 0 ? '+' : '';
        return <span className="opacity-60 ml-1 text-[9px] font-bold">({sign}{d.toFixed(3)})</span>;
    };

    return (
        <Link
            to={`/color/${swatch.id}`}
            className="group relative flex flex-col p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl border border-white/10 overflow-hidden min-h-[200px]"
            style={{ backgroundColor: `rgb(${swatch.rgb.join(',')})` }}
        >
            {/* Background brightness overlay for contrast */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${isDark ? 'bg-white' : 'bg-black'}`} />

            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <AddToPaletteDialog
                        swatch={swatch}
                        trigger={
                            <button className={`p-1.5 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-md border border-white/10 transition-colors ${textColor}`}>
                                <Plus className="w-4 h-4" />
                            </button>
                        }
                    />
                </div>
            </div>

            <div className="relative flex justify-between items-start mb-6 mt-2">
                <div className="min-w-0 pr-8">
                    <p className={`text-base font-black truncate tracking-tight ${textColor}`}>
                        {swatch.name || 'Unnamed'}
                        {swatch.number && <span className="ml-1 opacity-60 font-medium text-sm">({swatch.number})</span>}
                    </p>
                    <p className={`text-xs font-bold opacity-70 truncate uppercase tracking-widest mt-0.5 ${subTextColor}`}>{swatch.brand}</p>
                </div>
                {deltaToMain !== null && (
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <p className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/10 backdrop-blur-md border border-white/10 ${textColor}`}>
                            ΔE {deltaToMain.toFixed(2)}
                        </p>
                    </div>
                )}
            </div>

            <div className={`relative mt-auto grid grid-cols-3 gap-2 py-3 border-t ${borderColor} items-center`}>
                <div>
                    <p className={`text-[8px] uppercase font-black tracking-widest leading-none mb-1 ${subTextColor}`}>L</p>
                    <p className={`text-xs font-mono font-black border-l ${borderColor} pl-1.5 ${textColor}`}>
                        {Math.round(sL * 100)}%
                        {activeDimension !== 'L' && formatDiff(diffL, '%')}
                    </p>
                </div>
                <div>
                    <p className={`text-[8px] uppercase font-black tracking-widest leading-none mb-1 ${subTextColor}`}>C</p>
                    <p className={`text-xs font-mono font-black border-l ${borderColor} pl-1.5 ${textColor}`}>
                        {sC.toFixed(3)}
                        {activeDimension !== 'C' && formatDiffC(diffC)}
                    </p>
                </div>
                <div>
                    <p className={`text-[8px] uppercase font-black tracking-widest leading-none mb-1 ${subTextColor}`}>H</p>
                    <div className="flex items-center gap-1">
                        <div
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black text-white shadow-sm border border-white/10"
                            style={{ backgroundColor: `oklch(70% 0.2 ${Math.round(sH)})`, textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
                        >
                            {Math.round(sH)}°
                        </div>
                        {activeDimension !== 'H' && formatDiff(diffH, '°')}
                    </div>
                </div>
            </div>

            {/* Target Debug Info */}
            {deltaToTarget !== null && targetOklch && (
                <div className="relative mt-2 p-2 rounded-xl bg-black/5 backdrop-blur-xl border border-white/5 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <p className={`text-[7px] font-black uppercase tracking-widest opacity-40 ${textColor}`}>Search Target</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner"
                                style={{ backgroundColor: `oklch(${targetOklch[0] * 100}% ${targetOklch[1]} ${targetOklch[2]})` }}
                            />
                            <p className={`text-[9px] font-mono font-bold tracking-tight ${textColor}`}>
                                {Math.round(targetOklch[0] * 100)}% · {targetOklch[1].toFixed(2)} · {Math.round(targetOklch[2])}°
                            </p>
                        </div>
                    </div>
                    <p className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/10 border border-white/5 ${textColor}`}>
                        ΔE {deltaToTarget.toFixed(2)}
                    </p>
                </div>
            )}
        </Link>
    );
};

export default SwatchCard;
