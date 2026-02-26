import { Slider } from "@/components/ui/slider";
import { HueRangeSlider } from "@/components/ui/hue-range-slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ColorFiltersProps {
  collectionFilter: string;
  setCollectionFilter: (value: string) => void;
  hueRange: [number, number];
  setHueRange: (value: [number, number]) => void;
  chromaRange: [number, number];
  setChromaRange: (value: [number, number]) => void;
  lightnessRange: [number, number];
  setLightnessRange: (value: [number, number]) => void;
  collections: string[];
  maxChroma: number;
  handleReset: () => void;
}

export function ColorFilters({
  collectionFilter,
  setCollectionFilter,
  hueRange,
  setHueRange,
  chromaRange,
  setChromaRange,
  lightnessRange,
  setLightnessRange,
  collections,
  maxChroma,
  handleReset,
}: ColorFiltersProps) {
  return (
    <div className="p-6 bg-muted/30 rounded-2xl border space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground mb-2 block text-xs uppercase tracking-wider">
              Collection
            </Label>
            <Select value={collectionFilter} onValueChange={setCollectionFilter}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-4">
              Hue Filter
            </Label>
            <HueRangeSlider value={hueRange} onValueChange={(v) => setHueRange(v)} />
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
                Lightness ({Math.round(lightnessRange[0] * 100)}% –{" "}
                {Math.round(lightnessRange[1] * 100)}%)
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Reset Filters
        </Button>
      </div>
    </div>
  );
}
