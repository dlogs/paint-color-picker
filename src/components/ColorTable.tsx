import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { AseColor } from '../util/ase-parser';
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

interface ColorTableProps {
  colors: AseColor[];
}

const PAGE_SIZE = 50;
const columnHelper = createColumnHelper<AseColor>();

const SortIcon = ({ column }: { column: any }) => {
  const isSorted = column.getIsSorted();
  if (isSorted === 'asc') return <ArrowUp className="ml-2 h-4 w-4 text-indigo-400" />;
  if (isSorted === 'desc') return <ArrowDown className="ml-2 h-4 w-4 text-indigo-400" />;
  return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
};

const ColorTable: React.FC<ColorTableProps> = ({ colors }) => {
  // Filters state
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [hueRange, setHueRange] = useState<[number, number]>([0, 360]);
  const [satRange, setSatRange] = useState<[number, number]>([0, 1]);
  const [lightRange, setLightRange] = useState<[number, number]>([0, 1]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Pagination / Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Derived filter options
  const brands = useMemo(() => Array.from(new Set(colors.map(c => c.brand || 'Unknown'))), [colors]);
  const collections = useMemo(() => Array.from(new Set(colors.map(c => c.collection || 'General'))), [colors]);

  const filteredColors = useMemo(() => {
    return colors.filter(color => {
      const brandMatch = brandFilter === 'all' || (color.brand || 'Unknown') === brandFilter;
      const collectionMatch = collectionFilter === 'all' || (color.collection || 'General') === collectionFilter;

      const [h, s, l] = color.hsl;
      const hueMatch = hueRange[0] <= hueRange[1]
        ? h >= hueRange[0] && h <= hueRange[1]
        : h >= hueRange[0] || h <= hueRange[1];
      const satMatch = s >= satRange[0] && s <= satRange[1];
      const lightMatch = l >= lightRange[0] && l <= lightRange[1];

      return brandMatch && collectionMatch && hueMatch && satMatch && lightMatch;
    });
  }, [colors, brandFilter, collectionFilter, hueRange, satRange, lightRange]);

  // Reset pagination when filters or sorting change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [brandFilter, collectionFilter, hueRange, satRange, lightRange, sorting]);

  const handleReset = () => {
    setBrandFilter('all');
    setCollectionFilter('all');
    setHueRange([0, 360]);
    setSatRange([0, 1]);
    setLightRange([0, 1]);
    setSorting([]);
  };

  const columns = useMemo<ColumnDef<AseColor, any>[]>(() => [
    columnHelper.accessor('hsl', {
      id: 'swatch',
      header: 'Color',
      cell: (info) => {
        const [h, s, l] = info.getValue() as [number, number, number];
        return (
          <div
            className="w-10 h-10 rounded-lg border border-white/10 shadow-md"
            style={{ backgroundColor: `hsl(${h}, ${s * 100}%, ${l * 100}%)` }}
          />
        );
      },
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-slate-400 font-semibold relative"
        >
          Name
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
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
          className="p-0 hover:bg-transparent text-slate-400 font-semibold relative"
        >
          Brand
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="text-slate-300">{info.getValue() || 'Unknown'}</span>,
    }),
    columnHelper.accessor('collection', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-slate-400 font-semibold relative"
        >
          Collection
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="text-slate-500 italic">{info.getValue() || 'General'}</span>,
    }),
    columnHelper.accessor(row => Math.round(row.hsl[0]), {
      id: 'hue',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-slate-400 font-semibold relative"
        >
          Hue
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="font-mono text-indigo-300">{info.getValue()}°</span>,
    }),
    columnHelper.accessor(row => Math.round(row.hsl[1] * 100), {
      id: 'saturation',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-slate-400 font-semibold relative"
        >
          Sat
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="font-mono text-indigo-300">{info.getValue()}%</span>,
    }),
    columnHelper.accessor(row => Math.round(row.hsl[2] * 100), {
      id: 'lightness',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(column.getIsSorted() === "asc", e.shiftKey)}
          className="p-0 hover:bg-transparent text-slate-400 font-semibold relative"
        >
          Light
          <SortIcon column={column} />
          {column.getCanMultiSort() && column.getSortIndex() !== -1 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {column.getSortIndex() + 1}
            </span>
          )}
        </Button>
      ),
      cell: info => <span className="font-mono text-indigo-300">{info.getValue()}%</span>,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
        <div className="space-y-4">
          <div>
            <Label className="text-slate-400 mb-2 block text-xs uppercase tracking-wider">Brand</Label>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="bg-slate-900 border-slate-700">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400 mb-2 block text-xs uppercase tracking-wider">Collection</Label>
            <Select value={collectionFilter} onValueChange={setCollectionFilter}>
              <SelectTrigger className="bg-slate-900 border-slate-700">
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
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
            <Label className="text-slate-400 text-xs uppercase tracking-wider mb-4">Hue Filter</Label>
            <HueRangeSlider
              value={hueRange}
              onValueChange={(v) => setHueRange(v)}
            />
          </div>


        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Saturation ({Math.round(satRange[0] * 100)}% - {Math.round(satRange[1] * 100)}%)</Label>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={satRange}
              onValueChange={(v) => setSatRange(v as [number, number])}
              className="mt-2"
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-slate-400 text-xs uppercase tracking-wider">Lightness ({Math.round(lightRange[0] * 100)}% - {Math.round(lightRange[1] * 100)}%)</Label>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={lightRange}
              onValueChange={(v) => setLightRange(v as [number, number])}
              className="mt-2"
            />
          </div>
          <div className="flex items-end justify-end h-full pb-1">
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-400 hover:text-white">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container bg-slate-900/40 rounded-2xl border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/30">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-slate-700 hover:bg-transparent">
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
          <TableBody className="divide-y divide-slate-800">
            {visibleRows.map(row => (
              <TableRow key={row.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
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
          <div className="p-12 text-center text-slate-500">
            No colors match your filters.
          </div>
        ) : (
          <div
            ref={observerTarget}
            className="flex items-center justify-center p-8 text-slate-500 border-t border-slate-800"
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
