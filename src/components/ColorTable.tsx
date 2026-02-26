import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import type { Swatch } from '@/types/swatch';
import { ColorFilters } from './ColorFilters';
import { useColorFilters } from '@/hooks/useColorFilters';
import SwatchCard from './SwatchCard';

interface ColorTableProps {
  colors: Swatch[];
}

const ColorTable = ({ colors }: ColorTableProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, desc: boolean } | null>(null);

  const {
    collectionFilter, setCollectionFilter,
    hueRange, setHueRange,
    chromaRange, setChromaRange,
    lightnessRange, setLightnessRange,
    collections,
    maxChroma,
    filteredColors,
    handleReset: baseReset
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
        case 'name':
          valA = a.name; valB = b.name; break;
        case 'brand':
          valA = a.brand; valB = b.brand; break;
        case 'hue':
          valA = a.oklch[2]; valB = b.oklch[2]; break;
        case 'chroma':
          valA = a.oklch[1]; valB = b.oklch[1]; break;
        case 'lightness':
          valA = a.oklch[0]; valB = b.oklch[0]; break;
        default: return 0;
      }

      if (valA < valB) return sortConfig.desc ? 1 : -1;
      if (valA > valB) return sortConfig.desc ? -1 : 1;
      return 0;
    });
  }, [filteredColors, sortConfig]);

  // Responsive grid: 1 col (sm), 2 col (md), 3 col (lg)
  const columns = window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
  const rowCount = Math.ceil(sortedColors.length / columns);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 240, // height of a card + gap
    overscan: 5,
  });

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <ColorFilters
        collectionFilter={collectionFilter}
        setCollectionFilter={setCollectionFilter}
        hueRange={hueRange}
        setHueRange={setHueRange}
        chromaRange={chromaRange}
        setChromaRange={setChromaRange}
        lightnessRange={lightnessRange}
        setLightnessRange={setLightnessRange}
        collections={collections}
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
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mr-2">Sort By</Label>
          <Select
            value={sortConfig?.key || 'none'}
            onValueChange={(val) => {
              if (val === 'none') {
                setSortConfig(null);
              } else {
                setSortConfig({ key: val, desc: val === 'chroma' || val === 'lightness' });
              }
            }}
          >
            <SelectTrigger className="w-[160px] h-9 text-xs bg-muted/50 border-white/5 rounded-full px-4">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="none">Default</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="hue">Hue</SelectItem>
              <SelectItem value="chroma">Chroma (Highest)</SelectItem>
              <SelectItem value="lightness">Lightness (Brightest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowSwatches = sortedColors.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowSwatches.map((swatch) => (
                <SwatchCard
                  key={swatch.id}
                  swatch={swatch}
                />
              ))}
            </div>
          );
        })}

        {sortedColors.length === 0 && (
          <div className="p-24 text-center bg-muted/10 rounded-3xl border-2 border-dashed border-muted/20">
            <div className="text-4xl mb-4 opacity-20">🔍</div>
            <p className="text-muted-foreground font-medium">No colors match your current filters.</p>
          </div>
        )}
      </div>

      {sortedColors.length > 0 && rowVirtualizer.getTotalSize() > 0 && (
        <div className="flex flex-col items-center gap-2 pt-12">
          <div className="w-12 h-1 rounded-full bg-border/20 mb-4" />
          <span className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-black">End of Library</span>
        </div>
      )}
    </div>
  );
};

export default ColorTable;
