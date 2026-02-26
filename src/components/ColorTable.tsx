import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import type { Swatch } from "@/types/swatch";
import { ColorFilters } from "./ColorFilters";
import { useColorFilters } from "@/hooks/useColorFilters";
import SwatchCard from "./SwatchCard";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ColorTableProps {
  colors: Swatch[];
}

const ColorTable = ({ colors }: ColorTableProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; desc: boolean } | null>(null);

  const {
    hueRange,
    setHueRange,
    chromaRange,
    setChromaRange,
    lightnessRange,
    setLightnessRange,
    maxChroma,
    filteredColors,
    handleReset: baseReset,
  } = useColorFilters(colors);

  const handleReset = () => {
    baseReset();
    setSortConfig(null);
  };

  const sortedColors = useMemo(() => {
    if (!sortConfig) return filteredColors;

    return [...filteredColors].sort((a, b) => {
      let valA: any, valB: any;

      switch (sortConfig.key) {
        case "name":
          valA = a.name;
          valB = b.name;
          break;
        case "brand":
          valA = a.brand;
          valB = b.brand;
          break;
        case "hue":
          valA = a.oklch[2];
          valB = b.oklch[2];
          break;
        case "chroma":
          valA = a.oklch[1];
          valB = b.oklch[1];
          break;
        case "lightness":
          valA = a.oklch[0];
          valB = b.oklch[0];
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortConfig.desc ? 1 : -1;
      if (valA > valB) return sortConfig.desc ? -1 : 1;
      return 0;
    });
  }, [filteredColors, sortConfig]);

  // Responsive grid: 1 col (sm), 2 col (md), 3 col (lg)
  const isSm = useMediaQuery("(min-width: 640px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const columns = isLg ? 3 : isSm ? 2 : 1;

  const rowCount = Math.ceil(sortedColors.length / columns);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 272, // height of a card (240) + gap (32)
    overscan: 5,
  });

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <ColorFilters
        hueRange={hueRange}
        setHueRange={setHueRange}
        chromaRange={chromaRange}
        setChromaRange={setChromaRange}
        lightnessRange={lightnessRange}
        setLightnessRange={setLightnessRange}
        maxChroma={maxChroma}
        handleReset={handleReset}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {sortedColors.length} Colors Found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mr-2">
            Sort By
          </Label>
          <Select
            value={
              sortConfig
                ? ["hue", "chroma", "lightness"].includes(sortConfig.key)
                  ? `${sortConfig.key}-${sortConfig.desc ? "desc" : "asc"}`
                  : sortConfig.key
                : "none"
            }
            onValueChange={(val) => {
              if (val === "none") {
                setSortConfig(null);
              } else if (val.includes("-")) {
                const [key, dir] = val.split("-");
                setSortConfig({ key, desc: dir === "desc" });
              } else {
                setSortConfig({ key: val, desc: false });
              }
            }}
          >
            <SelectTrigger className="w-[200px] h-9 text-xs bg-muted/50 border-white/5 rounded-full px-4">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="none">Default</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="hue-asc">Hue (0° → 360°)</SelectItem>
              <SelectItem value="hue-desc">Hue (360° → 0°)</SelectItem>
              <SelectItem value="chroma-desc">Chroma (Most Vibrant)</SelectItem>
              <SelectItem value="chroma-asc">Chroma (Most Muted)</SelectItem>
              <SelectItem value="lightness-desc">Lightness (Brightest)</SelectItem>
              <SelectItem value="lightness-asc">Lightness (Darkest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowSwatches = sortedColors.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-8"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowSwatches.map((swatch) => (
                <SwatchCard key={swatch.id} swatch={swatch} />
              ))}
            </div>
          );
        })}

        {sortedColors.length === 0 && (
          <div className="p-24 text-center bg-muted/10 rounded-3xl border-2 border-dashed border-muted/20">
            <div className="text-4xl mb-4 opacity-20">🔍</div>
            <p className="text-muted-foreground font-medium">
              No colors match your current filters.
            </p>
          </div>
        )}
      </div>

      {sortedColors.length > 0 && rowVirtualizer.getTotalSize() > 0 && (
        <div className="flex flex-col items-center gap-2 pt-12">
          <div className="w-12 h-1 rounded-full bg-border/20 mb-4" />
          <span className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-black">
            End of Library
          </span>
        </div>
      )}
    </div>
  );
};

export default ColorTable;
