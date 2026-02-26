import { Link } from "react-router";
import { Plus } from "lucide-react";
import type { Swatch } from "@/types/swatch";
import { AddToPaletteDialog } from "./AddToPaletteDialog";
import { HuePill } from "./HuePill";
import { calculateDeltaE, calculateDeltaEFromOklch } from "@/util/similarity";

const DiffValue = ({ diff, unit = "" }: { diff: number | null; unit?: string }) => {
  if (!diff || diff === 0) return null;
  const sign = diff > 0 ? "+" : "";
  return (
    <span className="opacity-60 ml-1 text-[10px] font-bold">
      ({sign}
      {diff}
      {unit})
    </span>
  );
};

const DiffValueC = ({ diff }: { diff: number | null }) => {
  if (!diff || Math.abs(diff) < 0.001) return null;
  const sign = diff > 0 ? "+" : "";
  return (
    <span className="opacity-60 ml-1 text-[10px] font-bold">
      ({sign}
      {diff.toFixed(3)})
    </span>
  );
};

const StatContainer = ({
  label,
  subTextColor,
  borderColor,
  children,
}: {
  label: string;
  subTextColor: string;
  borderColor: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-1.5 min-w-0">
    <p className={`text-[10px] uppercase font-black tracking-widest leading-none ${subTextColor}`}>
      {label}
    </p>
    <div className={`flex items-center gap-1 border-l ${borderColor} pl-1.5 min-w-0 flex-1`}>
      {children}
    </div>
  </div>
);

interface SwatchCardProps {
  swatch: Swatch;
  activeDimension?: "L" | "C" | "H";
  mainColor?: Swatch;
  targetOklch?: [number, number, number];
}

const SwatchCard = ({ swatch, activeDimension, mainColor, targetOklch }: SwatchCardProps) => {
  const [sL, sC, sH] = swatch.oklch;

  // Delta-E to the MAIN color (if provided)
  const deltaToMain = mainColor
    ? calculateDeltaE(
        swatch.oklab as [number, number, number],
        mainColor.oklab as [number, number, number],
      )
    : null;

  // Delta-E to the SEARCH TARGET (if provided)
  const deltaToTarget = targetOklch
    ? calculateDeltaEFromOklch(targetOklch, swatch.oklab as [number, number, number])
    : null;

  const isDark = sL < 0.6;
  const textColor = isDark ? "text-white" : "text-black";
  const subTextColor = isDark ? "text-white/60" : "text-black/50";
  const borderColor = isDark ? "border-white/20" : "border-black/10";

  // Diff calculations relative to main color
  const diffL = mainColor ? Math.round((sL - mainColor.oklch[0]) * 100) : 0;
  const diffC = mainColor ? sC - mainColor.oklch[1] : 0;
  let diffH = mainColor ? Math.round(sH - mainColor.oklch[2]) : 0;
  if (diffH > 180) diffH -= 360;
  if (diffH < -180) diffH += 360;

  return (
    <div
      className="group relative flex flex-col p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl border border-white/10 overflow-hidden min-h-[200px]"
      style={{ backgroundColor: `rgb(${swatch.rgb.join(",")})` }}
    >
      {/* Main Link - Inset pattern to avoid button nesting */}
      <Link
        to={`/color/${swatch.id}`}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label={`View details for ${swatch.name}`}
      />

      {/* Background brightness overlay for contrast */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none ${isDark ? "bg-white" : "bg-black"}`}
      />

      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <AddToPaletteDialog
          swatch={swatch}
          trigger={
            <button
              className={`p-1.5 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-md border border-white/10 transition-colors ${textColor}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          }
        />
      </div>

      <div className="relative z-1 flex justify-between items-start mb-6 mt-2 pointer-events-none">
        <div className="min-w-0 pr-8">
          <p className={`text-base font-black truncate tracking-tight ${textColor}`}>
            {swatch.name || "Unnamed"}
            {swatch.number && (
              <span className="ml-1 opacity-60 font-medium text-sm">({swatch.number})</span>
            )}
          </p>
          <p
            className={`text-xs font-bold opacity-70 truncate uppercase tracking-widest mt-0.5 ${subTextColor}`}
          >
            {swatch.brand}
          </p>
        </div>
        {deltaToMain !== null && (
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            <p
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/10 backdrop-blur-md border border-white/10 ${textColor}`}
            >
              ΔE {deltaToMain.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div
        className={`relative z-1 mt-auto flex flex-wrap gap-2 py-3 border-t ${borderColor} items-center justify-between pointer-events-none`}
      >
        <StatContainer label="L" subTextColor={subTextColor} borderColor={borderColor}>
          <span className={`text-xs font-mono font-black ${textColor}`}>
            {Math.round(sL * 100)}%
          </span>
          {activeDimension !== "L" && <DiffValue diff={mainColor ? diffL : null} unit="%" />}
        </StatContainer>
        <StatContainer label="C" subTextColor={subTextColor} borderColor={borderColor}>
          <span className={`text-xs font-mono font-black ${textColor}`}>{sC.toFixed(3)}</span>
          {activeDimension !== "C" && <DiffValueC diff={mainColor ? diffC : null} />}
        </StatContainer>
        <StatContainer label="H" subTextColor={subTextColor} borderColor={borderColor}>
          <HuePill hue={sH} className="px-1.5 py-0.5 text-[10px] shadow-sm border-white/10" />
          {activeDimension !== "H" && <DiffValue diff={mainColor ? diffH : null} unit="°" />}
        </StatContainer>
      </div>

      {/* Target Debug Info */}
      {deltaToTarget !== null && targetOklch && (
        <div className="relative z-1 mt-2 p-2 rounded-xl bg-black/5 backdrop-blur-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
          <div className="flex flex-col gap-0.5">
            <p
              className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${textColor}`}
            >
              Search Target
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner"
                style={{
                  backgroundColor: `oklch(${targetOklch[0] * 100}% ${targetOklch[1]} ${targetOklch[2]})`,
                }}
              />
              <p className={`text-[10px] font-mono font-bold tracking-tight ${textColor}`}>
                {Math.round(targetOklch[0] * 100)}% · {targetOklch[1].toFixed(2)} ·{" "}
                {Math.round(targetOklch[2])}°
              </p>
            </div>
          </div>
          <p
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/10 border border-white/5 ${textColor}`}
          >
            ΔE {deltaToTarget.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default SwatchCard;
