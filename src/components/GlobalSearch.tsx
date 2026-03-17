import * as React from "react";
import { useNavigate } from "react-router";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Swatch } from "@/types/swatch";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const searchWrapperVariants = cva(
  "relative z-40 rounded-xl border-2 shadow-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card",
        adaptiveLight:
          "bg-white/10 border-white/20 text-white shadow-none [&_[data-slot=command-input-wrapper]]:border-transparent",
        adaptiveDark:
          "bg-black/5 border-black/10 text-black shadow-none [&_[data-slot=command-input-wrapper]]:border-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const searchInputVariants = cva("h-14 text-lg", {
  variants: {
    variant: {
      default: "",
      adaptiveLight: "placeholder:text-white/50",
      adaptiveDark: "placeholder:text-black/40",
    },
  },
  defaultVariants: { variant: "default" },
});

const searchDropdownVariants = cva(
  "absolute top-full left-0 right-0 z-40 mt-2 rounded-xl border-2 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
  {
    variants: {
      variant: {
        default: "bg-card",
        adaptiveLight: "bg-black/80 border-white/20",
        adaptiveDark: "bg-white/80 border-black/20",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface GlobalSearchProps {
  colors: Swatch[];
  hasAccent?: boolean;
  isDarkAccent?: boolean;
}

export function GlobalSearch({ colors, hasAccent, isDarkAccent }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const navigate = useNavigate();

  const { settings } = useGlobalSettings();

  // Manual filtering for the best control and performance over ~2000 items
  const filteredColors = React.useMemo(() => {
    if (!value) return [];
    const query = value.toLowerCase().split(/\s+/).filter(Boolean);
    return colors
      .filter((c) => {
        const collectionId = `${c.brand} - ${c.collection || "General"}`;
        if (settings.disabledCollections.includes(collectionId)) {
          return false;
        }

        const target = `${c.name} ${c.number || ""} ${c.brand}`.toLowerCase();
        return query.every((word) => target.includes(word));
      })
      .slice(0, 50);
  }, [colors, value, settings.disabledCollections]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Command
        className={cn(
          "overflow-visible",
          searchWrapperVariants({
            variant: hasAccent ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "default",
          }),
        )}
        shouldFilter={false} // We handle filtering ourselves
      >
        <CommandInput
          placeholder="Search colors by name or number (e.g. 'White Dove' or 'SW 7005')..."
          value={value}
          onValueChange={setValue}
          onFocus={() => setOpen(true)}
          className={searchInputVariants({
            variant: hasAccent ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "default",
          })}
        />
        {open && value && (
          <div
            className={searchDropdownVariants({
              variant: hasAccent ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "default",
            })}
          >
            <CommandList className="max-h-[min(500px,60vh)] p-2">
              <CommandEmpty>
                <div className="py-12 text-center text-current">
                  <div className="text-4xl mb-4 opacity-20">🎨</div>
                  <p className="opacity-70">No colors found for "{value}"</p>
                </div>
              </CommandEmpty>
              <CommandGroup
                heading={`${filteredColors.length} Results`}
                className={cn(
                  "gap-1",
                  hasAccent
                    ? isDarkAccent
                      ? "[&_[cmdk-group-heading]]:text-white/40"
                      : "[&_[cmdk-group-heading]]:text-black/40"
                    : "",
                )}
              >
                {filteredColors.map((color) => (
                  <CommandItem
                    key={color.id}
                    value={`${color.name} ${color.number || ""} ${color.brand}`}
                    onSelect={() => {
                      navigate(`/color/${color.id}`);
                      setOpen(false);
                      setValue("");
                    }}
                    className="p-0 mb-1 aria-selected:bg-transparent data-[selected=true]:bg-transparent"
                  >
                    <div
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-lg border border-white/10 transition-all hover:scale-[1.01] cursor-pointer group relative overflow-hidden active:scale-95",
                        // Selection style for keyboard nav
                        "group-data-[selected=true]:ring-2 group-data-[selected=true]:ring-primary/50",
                      )}
                      style={{ backgroundColor: `rgb(${color.rgb.join(",")})` }}
                    >
                      {/* Contrast overlay */}
                      <div
                        className={cn(
                          "absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors",
                          "group-data-[selected=true]:bg-black/10",
                        )}
                      />

                      <div
                        className={cn(
                          "relative z-10 flex flex-col min-w-0 px-1 py-0.5 rounded-md",
                          // Contrast helper based on lightness
                          color.oklch[0] < 0.6 ? "text-white" : "text-black",
                        )}
                      >
                        <span className="font-bold truncate text-sm">{color.name}</span>
                        <div className="flex items-center gap-2 opacity-70">
                          {color.number && (
                            <span className="text-[10px] font-mono leading-none border-r border-current pr-2">
                              {color.number}
                            </span>
                          )}
                          <span className="text-[10px] uppercase tracking-wider font-bold truncate">
                            {color.brand}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>

      {/* Click away listener overlay */}
      {open && <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setOpen(false)} />}
    </div>
  );
}
