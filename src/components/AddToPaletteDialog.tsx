import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  getPalettes,
  createPalette,
  addSwatchToPalette,
  addSwatchesToPalette,
} from "../services/palette-storage";
import type { Palette } from "../types/palette";
import type { Swatch } from "../types/swatch";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AddToPaletteDialogProps {
  swatch?: Swatch;
  swatches?: Swatch[];
  trigger?: React.ReactNode;
  hasAccent?: boolean;
  isDarkAccent?: boolean;
  defaultName?: string;
}

export function AddToPaletteDialog({
  swatch,
  swatches,
  trigger,
  hasAccent,
  isDarkAccent,
  defaultName,
}: AddToPaletteDialogProps) {
  const [open, setOpen] = useState(false);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [newPaletteName, setNewPaletteName] = useState("");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const swatchesToSave = swatches || (swatch ? [swatch] : []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPalettes(getPalettes());
      setNewPaletteName(defaultName || "");
    }
  };

  const saveToPalette = (paletteId: string) => {
    if (swatchesToSave.length === 0) return;
    if (swatchesToSave.length === 1) {
      addSwatchToPalette(paletteId, swatchesToSave[0].id);
    } else {
      addSwatchesToPalette(
        paletteId,
        swatchesToSave.map((s) => s.id),
      );
    }
    setOpen(false);
  };

  const createAndSave = () => {
    if (!newPaletteName.trim() || swatchesToSave.length === 0) return;
    const newPalette = createPalette(newPaletteName.trim());
    saveToPalette(newPalette.id);
  };

  const DialogTriggerButton = trigger || (
    <Button
      variant={hasAccent ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "outline"}
      className={cn("gap-2 rounded-full px-6 font-bold transition-all")}
    >
      <Plus className="w-4 h-4" />
      {swatchesToSave.length > 1 ? "Save Palette" : "Add to Palette"}
    </Button>
  );

  const listContent = (
    <div className="flex flex-col gap-4 py-4 px-4 md:px-0">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New Palette Name..."
          value={newPaletteName}
          onChange={(e) => setNewPaletteName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createAndSave();
            }
          }}
          autoFocus={isDesktop}
        />
        <Button size="icon" onClick={createAndSave} disabled={!newPaletteName.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {palettes.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 pb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">
            Your Palettes
          </p>
          {palettes.map((p) => (
            <button
              key={p.id}
              onClick={() => saveToPalette(p.id)}
              className="group flex items-center justify-between w-full p-4 rounded-xl border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all text-left shadow-sm hover:shadow-md"
            >
              <div className="flex flex-col">
                <span className="font-semibold group-hover:text-accent-foreground transition-colors">
                  {p.name}
                </span>
                <span className="text-sm text-muted-foreground">{p.swatches.length} colors</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{DialogTriggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {swatchesToSave.length > 1
                ? `Save ${swatchesToSave.length} Colors`
                : "Add to Palette"}
            </DialogTitle>
          </DialogHeader>
          {listContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{DialogTriggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {swatchesToSave.length > 1 ? `Save ${swatchesToSave.length} Colors` : "Add to Palette"}
          </DrawerTitle>
        </DrawerHeader>
        {listContent}
      </DrawerContent>
    </Drawer>
  );
}
