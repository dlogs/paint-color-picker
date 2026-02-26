import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Swatch } from '@/types/swatch';
import { ColorFilters } from './ColorFilters';
import { useColorFilters } from '@/hooks/useColorFilters';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import SwatchCard from './SwatchCard';

interface ColorTableProps {
  colors: Swatch[];
}

const PAGE_SIZE = 50;

const ColorTable = ({ colors }: ColorTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Use custom hooks for filters and infinite scroll
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

  const { visibleCount, observerTarget } = useInfiniteScroll({
    totalCount: filteredColors.length,
    pageSize: PAGE_SIZE,
    resetDeps: [collectionFilter, hueRange, chromaRange, lightnessRange, sorting]
  });

  const handleReset = () => {
    baseReset();
    setSorting([]);
  };

  const columns = useMemo<ColumnDef<Swatch, any>[]>(() => [
    {
      accessorKey: 'name',
      id: 'name',
    },
    {
      accessorKey: 'brand',
      id: 'brand',
    },
    {
      accessorFn: row => Math.round(row.oklch[2]),
      id: 'hue',
    },
    {
      accessorFn: row => row.oklch[1],
      id: 'chroma',
    },
    {
      accessorFn: row => row.oklch[0],
      id: 'lightness',
    },
  ], []);

  const table = useReactTable({
    data: filteredColors,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const allRows = table.getRowModel().rows;
  const visibleRows = useMemo(() => allRows.slice(0, visibleCount), [allRows, visibleCount]);

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
            {filteredColors.length} Colors Found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mr-2">Sort By</Label>
          <Select
            value={sorting[0]?.id || 'none'}
            onValueChange={(val) => {
              if (val === 'none') {
                setSorting([]);
              } else {
                setSorting([{ id: val, desc: val === 'chroma' || val === 'lightness' }]);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleRows.map(row => (
          <SwatchCard
            key={row.original.id}
            swatch={row.original}
          />
        ))}

        {filteredColors.length === 0 && (
          <div className="col-span-full p-24 text-center bg-muted/10 rounded-3xl border-2 border-dashed border-muted/20">
            <div className="text-4xl mb-4 opacity-20">🔍</div>
            <p className="text-muted-foreground font-medium">No colors match your current filters.</p>
          </div>
        )}
      </div>

      <div
        ref={observerTarget}
        className="flex items-center justify-center p-12 text-muted-foreground"
      >
        {visibleCount < filteredColors.length ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Loading more colors</span>
          </div>
        ) : filteredColors.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-1 rounded-full bg-border/20 mb-4" />
            <span className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-black">End of Library</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorTable;
