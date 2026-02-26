import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Share2,
  Check,
  Download,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  getPalettes,
  removeSwatchFromPalette,
  moveSwatchInPalette,
} from "../services/palette-storage";
import type { Palette } from "../types/palette";
import type { Swatch } from "../types/swatch";
import { HuePill } from "./HuePill";
import { AddToPaletteDialog } from "./AddToPaletteDialog";

interface PaletteDetailProps {
  allColors: Swatch[];
}

export default function PaletteDetail({ allColors }: PaletteDetailProps) {
  const { paletteId } = useParams<{ paletteId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [palette, setPalette] = useState<Palette | null>(null);
  const [copied, setCopied] = useState(false);

  const isShared = paletteId === "shared";

  const loadPalette = () => {
    if (isShared) {
      const name = searchParams.get("name") || "Shared Palette";
      const colorsStr = searchParams.get("colors");
      if (!colorsStr) {
        navigate("/palettes", { replace: true });
        return;
      }

      const swatchIds = colorsStr.split(",").filter(Boolean);
      setPalette({
        id: "shared",
        name,
        swatches: swatchIds,
        createdAt: Date.now(),
      });
      return;
    }

    const palettes = getPalettes();
    const found = palettes.find((p) => p.id === paletteId);
    if (!found) {
      navigate("/palettes", { replace: true });
    } else {
      setPalette(found);
    }
  };

  useEffect(() => {
    loadPalette();
  }, [paletteId, navigate, searchParams]);

  if (!palette) return null;

  const paletteColors = palette.swatches
    .map((id) => allColors.find((c) => c.id === id))
    .filter((c): c is Swatch => c !== undefined);

  const handleRemove = (swatchId: string) => {
    if (confirm("Remove this color from the palette?")) {
      removeSwatchFromPalette(palette.id, swatchId);
      loadPalette();
    }
  };

  const handleMove = (swatchId: string, direction: "left" | "right") => {
    if (isShared) return;
    moveSwatchInPalette(palette.id, swatchId, direction);
    loadPalette();
  };

  const handleShare = () => {
    if (isShared || paletteColors.length === 0) return;

    // Construct share URL
    const colorIds = paletteColors.map((c) => c.id).join(",");
    const url = new URL(window.location.href);
    url.pathname = "/palette/shared";
    url.searchParams.set("name", palette.name);
    url.searchParams.set("colors", colorIds);

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
            <Link to="/palettes">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold truncate">{palette.name}</h1>
            <p className="text-muted-foreground">
              {paletteColors.length} Colors {isShared && "(Preview)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isShared ? (
            <AddToPaletteDialog
              swatches={paletteColors}
              defaultName={palette.name}
              trigger={
                <Button variant="outline" className="gap-2 rounded-full px-6 transition-all">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Palette</span>
                </Button>
              }
            />
          ) : (
            <Button
              variant="outline"
              className="gap-2 rounded-full px-6 transition-all"
              onClick={handleShare}
              disabled={paletteColors.length === 0}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied Link!" : "Share"}</span>
            </Button>
          )}
        </div>
      </div>

      {paletteColors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 bg-card rounded-3xl border-2 border-dashed border-muted text-center">
          <div className="text-6xl mb-4 opacity-20">🎨</div>
          <h2 className="text-2xl font-semibold mb-2">Palette is Empty</h2>
          <p className="text-muted-foreground mb-8">
            Add colors from the main library to compare them side-by-side.
          </p>
          <Button asChild variant="outline" className="rounded-full px-6 font-bold transition-all">
            <Link to="/">Browse Library</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6 overflow-hidden">
          {/* Compare View - Side By Side Columns (Desktop) / Vertical Stack (Mobile) */}
          <div className="flex flex-col md:flex-row h-auto md:h-[60vh] min-h-[500px] rounded-lg overflow-hidden border">
            {paletteColors.map((color, index) => {
              const contrastText = color.oklch[0] < 0.6 ? "text-white" : "text-black";
              const contrastMuted = color.oklch[0] < 0.6 ? "text-white/70" : "text-black/70";
              const contrastBorder = color.oklch[0] < 0.6 ? "border-white/10" : "border-black/10";

              return (
                <div
                  key={color.id}
                  className="flex-1 min-h-[250px] md:min-h-0 flex flex-col group relative overflow-hidden transition-all duration-300 md:hover:flex-[1.2] border-b md:border-b-0 md:border-r border-background/20 last:border-0"
                  style={{ backgroundColor: `rgb(${color.rgb.join(",")})` }}
                >
                  {!isShared && (
                    <div className="absolute top-4 left-4 z-10 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMove(color.id, "left")}
                          className={`hover:bg-black/10 focus:opacity-100 ${contrastText} w-8 h-8 rounded-full`}
                          title="Move left/up"
                        >
                          <ChevronLeft className="hidden md:block w-5 h-5" />
                          <ChevronUp className="md:hidden w-5 h-5" />
                        </Button>
                      )}
                      {index < paletteColors.length - 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMove(color.id, "right")}
                          className={`hover:bg-black/10 focus:opacity-100 ${contrastText} w-8 h-8 rounded-full`}
                          title="Move right/down"
                        >
                          <ChevronRight className="hidden md:block w-5 h-5" />
                          <ChevronDown className="md:hidden w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  )}
                  {!isShared && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(color.id)}
                      className={`absolute top-4 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 hover:bg-black/10 focus:opacity-100 ${contrastText}`}
                      title="Remove from palette"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <div
                    className={`mt-auto p-6 flex flex-col items-center text-center ${contrastText}`}
                  >
                    <span
                      className={`text-xs font-mono mb-2 px-2 py-1 rounded bg-black/10 backdrop-blur-sm ${contrastBorder}`}
                    >
                      {color.number}
                    </span>
                    <h2 className="text-2xl font-bold mb-1 leading-tight">{color.name}</h2>
                    <p className={`text-xs uppercase tracking-widest font-bold ${contrastMuted}`}>
                      {color.brand}
                    </p>

                    {/* Stats */}
                    <div
                      className={`grid grid-cols-3 gap-4 w-full mt-6 pt-4 border-t ${contrastBorder} text-sm`}
                    >
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${contrastMuted}`}
                        >
                          Light
                        </span>
                        <span className="font-mono">{color.oklch[0].toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${contrastMuted}`}
                        >
                          Chroma
                        </span>
                        <span className="font-mono">{color.oklch[1].toFixed(3)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${contrastMuted}`}
                        >
                          Hue
                        </span>
                        <HuePill hue={color.oklch[2]} className="px-2 py-0.5 text-xs shadow-sm" />
                      </div>
                    </div>

                    <div className="mt-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button
                        asChild
                        variant="outline"
                        className="bg-background/20 backdrop-blur hover:bg-background/40 border-0"
                      >
                        <Link to={`/color/${color.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
