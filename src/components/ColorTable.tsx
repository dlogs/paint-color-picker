import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { AseEntry } from '../util/ase-parser';
import { Slider } from '@/components/ui/slider';
import { HueRangeSlider } from '@/components/ui/hue-range-slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Swatch } from '@/services/swatch-assets';

interface ColorTableProps {
  colors: Swatch[];
}

const PAGE_SIZE = 50;
const columnHelper = createColumnHelper<Swatch>();

const SortIcon = ({ column }: { column: any }) => {
  const isSorted = column.getIsSorted();
  if (isSorted === 'asc') return <ArrowUp className="ml-2 h-4 w-4 text-primary" />;
  if (isSorted === 'desc') return <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
};

const ColorTable: React.FC<ColorTableProps> = ({ colors }) => {
  const navigate = useNavigate();
  // Filters state
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [hueRange, setHueRange] = useState<[number, number]>([0, 360]);
  const [chromaRange, setChromaRange] = useState<[number, number]>([0, 1]);
  const [lightnessRange, setLightnessRange] = useState<[number, number]>([0, 1]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Pagination / Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Derived filter options
  const brands = useMemo(() => Array.from(new Set(colors.map(c => c.brand || 'Unknown'))), [colors]);
  const collections = useMemo(() => Array.from(new Set(colors.map(c => c.collection || 'General'))), [colors]);

  // Max chroma from the actual loaded colors (OKLCh C channel)
  const maxChroma = useMemo(() => {
    if (colors.length === 0) return 0.4;
    return Math.ceil(Math.max(...colors.map(c => c.oklch[1])) * 1000) / 1000;
  }, [colors]);

  // Reset chroma range when colors change (new palette loaded)
  useEffect(() => {
    setChromaRange([0, maxChroma]);
  }, [maxChroma]);

  const filteredColors = useMemo(() => {
    return colors.filter(color => {
      const brandMatch = brandFilter === 'all' || (color.brand || 'Unknown') === brandFilter;
      const collectionMatch = collectionFilter === 'all' || (color.collection || 'General') === collectionFilter;

      const [okL, okC, okH] = color.oklch;
      const hueMatch = hueRange[0] <= hueRange[1]
        ? okH >= hueRange[0] && okH <= hueRange[1]
        : okH >= hueRange[0] || okH <= hueRange[1];
      const chromaMatch = okC >= chromaRange[0] && okC <= chromaRange[1];
      const lightnessMatch = okL >= lightnessRange[0] && okL <= lightnessRange[1];

      return brandMatch && collectionMatch && hueMatch && chromaMatch && lightnessMatch;
    });
  }, [colors, brandFilter, collectionFilter, hueRange, chromaRange, lightnessRange]);

  // Reset pagination when filters or sorting change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [brandFilter, collectionFilter, hueRange, chromaRange, lightnessRange, sorting]);

  const handleReset = () => {
    setBrandFilter('all');
    setCollectionFilter('all');
    setHueRange([0, 360]);
    setChromaRange([0, maxChroma]);
    setLightnessRange([0, 1]);
    setSorting([]);
  };

  const columns = useMemo<ColumnDef<Swatch, any>[]>(() => [
    columnHelper.accessor('oklch', {
      id: 'swatch',
      header: 'Color',
      cell: (info) => {
        const [l, c, h] = info.getValue() as [number, number, number];
        return (
          <div
            className="w-10 h-10 rounded-lg border border-white/10 shadow-md"
            style={{ backgroundColor: `oklch(${l * 100}% ${c} ${h})` }}
          />
        );
      },
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-muted-foreground font-semibold relative"
        >
          Name
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="font-semibold text-white">{info.getValue() || 'Unnamed'}</span>,
    }),
    columnHelper.accessor('brand', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-muted-foreground font-semibold relative"
        >
          Brand
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="text-foreground/80">{info.getValue() || 'Unknown'}</span>,
    }),
    columnHelper.accessor('collection', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-muted-foreground font-semibold relative"
        >
          Collection
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="text-muted-foreground italic">{info.getValue() || 'General'}</span>,
    }),
    columnHelper.accessor(row => Math.round(row.oklch[2]), {
      id: 'hue',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-muted-foreground font-semibold relative"
        >
          Hue
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => {
        const hue = info.getValue();
        return (
          <div
            className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm border border-white/20 whitespace-nowrap"
            style={{
              backgroundColor: `oklch(70% 0.2 ${hue})`,
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
          >
            {hue}°
          </div>
        );
      },
    }),
    columnHelper.accessor(row => (row.oklch[1] * 1000 | 0) / 1000, {
      id: 'chroma',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-muted-foreground font-semibold relative"
        >
          Chroma
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="font-mono text-primary/80">{info.getValue()}</span>,
    }),
    columnHelper.accessor(row => Math.round(row.oklch[0] * 100), {
      id: 'lightness',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-muted-foreground font-semibold relative"
        >
          Lightness
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="font-mono text-primary/80">{info.getValue()}%</span>,
    }),
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

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && visibleCount < allRows.length) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, allRows.length));
    }
  }, [allRows.length, visibleCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1,
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Filters Section */}
      <div className="p-6 bg-muted/30 rounded-2xl border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground mb-2 block text-xs uppercase tracking-wider">Brand</Label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground mb-2 block text-xs uppercase tracking-wider">Collection</Label>
              <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                <SelectTrigger className="bg-background border-input">
                  <SelectValue placeholder="All Collections" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-4">Hue Filter</Label>
              <HueRangeSlider
                value={hueRange}
                onValueChange={(v) => setHueRange(v)}
              />
            </div>


          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Chroma ({chromaRange[0].toFixed(3)} – {chromaRange[1].toFixed(3)})
                </Label>
              </div>
              <Slider
                min={0}
                max={maxChroma}
                step={0.001}
                value={chromaRange}
                onValueChange={(v) => setChromaRange(v as [number, number])}
                className="mt-2"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Lightness ({Math.round(lightnessRange[0] * 100)}% – {Math.round(lightnessRange[1] * 100)}%)
                </Label>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={lightnessRange}
                onValueChange={(v) => setLightnessRange(v as [number, number])}
                className="mt-2"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-border/10">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Filters
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container bg-background/40 rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="px-6 py-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y border-t">
            {visibleRows.map(row => (
              <TableRow
                key={row.id}
                className="border-border hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => navigate(`/color/${row.original.id}`)}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredColors.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No colors match your filters.
          </div>
        ) : (
          <div
            ref={observerTarget}
            className="flex items-center justify-center p-8 text-muted-foreground border-t"
          >
            {visibleCount < filteredColors.length ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading more colors...</span>
              </div>
            ) : (
              <span className="text-xs uppercase tracking-widest opacity-50 font-bold">End of Library</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorTable;
