import { Outlet, Link } from "react-router";
import { PaletteIcon, SettingsIcon, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { GlobalSearch } from "./GlobalSearch";
import PaletteList from "./PaletteList";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { cn } from "@/lib/utils";
import type { Swatch } from "@/types/swatch";

interface LayoutProps {
  allColors: Swatch[];
  accentColor: string | null;
  isDarkAccent: boolean;
  onAccentChange: (color: string | null, isDark: boolean) => void;
}

export const Layout = ({ allColors, accentColor, isDarkAccent }: LayoutProps) => {
  const textColor = accentColor ? (isDarkAccent ? "text-white" : "text-black") : "text-foreground";

  return (
    <main
      className="min-h-screen py-12 px-4 flex flex-col items-center transition-colors duration-500"
      style={{ backgroundColor: accentColor || "var(--background)" }}
    >
      <div className="w-full max-w-6xl space-y-8">
        {/* Top Bar with Global Search and Navigation */}
        <div
          className={cn(
            "flex flex-row items-center gap-2 sm:gap-4 w-full relative z-40",
            textColor,
          )}
        >
          <div className="flex-1 w-full relative">
            <GlobalSearch
              colors={allColors}
              hasAccent={!!accentColor}
              isDarkAccent={isDarkAccent}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant={
                      accentColor ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "outline"
                    }
                    className={cn(
                      "h-14 px-6 rounded-xl font-bold text-lg gap-2 transition-all backdrop-blur-md",
                      !accentColor && "bg-card hover:bg-muted border-2",
                    )}
                  >
                    <PaletteIcon className="w-6 h-6" />
                    <span>My Palettes</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
                      <PaletteIcon className="w-6 h-6 text-primary" />
                      My Palettes
                    </SheetTitle>
                    <SheetDescription>View and manage your saved color palettes.</SheetDescription>
                  </SheetHeader>
                  <PaletteList allColors={allColors} />
                </SheetContent>
              </Sheet>

              <Button
                asChild
                variant={
                  accentColor ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "outline"
                }
                className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-all backdrop-blur-md",
                  !accentColor && "bg-card hover:bg-muted border-2",
                )}
              >
                <Link to="/settings" aria-label="Settings">
                  <SettingsIcon className="w-6 h-6" />
                </Link>
              </Button>
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant={
                      accentColor ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "outline"
                    }
                    className={cn(
                      "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-all backdrop-blur-md",
                      !accentColor && "bg-card hover:bg-muted border-2",
                    )}
                  >
                    <Menu className="w-6 h-6 shrink-0" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className={cn(
                    "w-[85vw] sm:w-[400px] overflow-y-auto",
                    accentColor
                      ? isDarkAccent
                        ? "bg-black/95 border-white/20"
                        : "bg-white/95 border-black/10"
                      : "bg-background",
                  )}
                >
                  <div className="flex flex-col gap-6 mt-6">
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <PaletteIcon className="w-5 h-5 text-primary" />
                        My Palettes
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        View and manage your saved color palettes.
                      </p>
                      <PaletteList allColors={allColors} />
                    </div>

                    <div className="h-px bg-border/50 w-full" />

                    <Button
                      asChild
                      variant="ghost"
                      className="justify-start px-4 h-14 text-base font-medium rounded-xl"
                    >
                      <Link to="/settings" className="flex items-center gap-3">
                        <SettingsIcon className="w-5 h-5" />
                        Settings
                      </Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <Outlet />
      </div>
    </main>
  );
};
