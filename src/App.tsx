import { useState, useEffect } from 'react'
import ColorTable from './components/ColorTable'
import { fetchBuiltInSwatches } from './services/swatch-provider'
import type { Swatch } from './types/swatch'
import ColorDetail from './components/ColorDetail'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { GlobalSearch } from './components/GlobalSearch'
import PaletteList from './components/PaletteList'
import PaletteDetail from './components/PaletteDetail'
import { Button } from './components/ui/button'
import { Link } from 'react-router'
import { PaletteIcon, SettingsIcon, Menu } from 'lucide-react'
import Settings from './components/Settings'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from './components/ui/sheet'
import { cn } from '@/lib/utils'

function App() {
  const [builtInColors, setBuiltInColors] = useState<Swatch[]>([])
  const allColors = [...builtInColors]
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [isDarkAccent, setIsDarkAccent] = useState(false)

  const textColor = accentColor ? (isDarkAccent ? 'text-white' : 'text-black') : 'text-foreground'

  // Load built-in colors from bundled JSON assets
  useEffect(() => {
    fetchBuiltInSwatches().then(setBuiltInColors)
  }, [])

  return (
    <BrowserRouter>
      <main
        className="min-h-screen py-12 px-4 flex flex-col items-center transition-colors duration-500"
        style={{ backgroundColor: accentColor || 'var(--background)' }}
      >
        <div className="w-full max-w-6xl space-y-8">
          {/* Top Bar with Global Search and Navigation */}
          <div className={`flex flex-row items-center gap-2 sm:gap-4 w-full relative z-40 ${textColor}`}>
            <div className="flex-1 w-full relative">
              <GlobalSearch colors={allColors} hasAccent={!!accentColor} isDarkAccent={isDarkAccent} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant={accentColor ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "outline"}
                      className={cn("h-14 px-6 rounded-xl font-bold text-lg gap-2 transition-all backdrop-blur-md", !accentColor && "bg-card hover:bg-muted border-2")}
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
                      <SheetDescription>
                        View and manage your saved color palettes.
                      </SheetDescription>
                    </SheetHeader>
                    <PaletteList allColors={allColors} />
                  </SheetContent>
                </Sheet>

                <Button
                  asChild
                  variant={accentColor ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "outline"}
                  className={cn("h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-all backdrop-blur-md", !accentColor && "bg-card hover:bg-muted border-2")}
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
                      variant={accentColor ? (isDarkAccent ? "adaptiveLight" : "adaptiveDark") : "outline"}
                      className={cn("h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-all backdrop-blur-md", !accentColor && "bg-card hover:bg-muted border-2")}
                    >
                      <Menu className="w-6 h-6 shrink-0" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className={`w-[85vw] sm:w-[400px] overflow-y-auto ${accentColor ? (isDarkAccent ? 'bg-black/95 border-white/20' : 'bg-white/95 border-black/10') : 'bg-background'}`}>
                    <div className="flex flex-col gap-6 mt-6">
                      <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <PaletteIcon className="w-5 h-5 text-primary" />
                          My Palettes
                        </h3>
                        <p className="text-sm text-muted-foreground">View and manage your saved color palettes.</p>
                        <PaletteList allColors={allColors} />
                      </div>

                      <div className="h-px bg-border/50 w-full" />

                      <Button asChild variant="ghost" className="justify-start px-4 h-14 text-base font-medium rounded-xl">
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

          <Routes>
            <Route
              path="/"
              element={
                allColors.length > 0 ? (
                  <div className={`bg-card rounded-xl border shadow-sm p-6 ${accentColor ? 'hidden' : ''}`}>
                    <ColorTable colors={allColors} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-24 bg-muted/50 rounded-3xl border-2 border-dashed border-muted animate-fade-in">
                    <div className="text-6xl mb-6 opacity-30">🎨</div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">Loading color library…</h2>
                    <p className="text-muted-foreground mb-8 max-w-md text-center">
                      Fetching built-in brand collections.
                    </p>
                  </div>
                )
              }
            />
            <Route
              path="/color/:colorId"
              element={
                <ColorDetail
                  allColors={allColors}
                  onAccentChange={(color: string | null, isDark: boolean) => {
                    setAccentColor(color);
                    setIsDarkAccent(isDark);
                  }}
                />
              }
            />
            <Route
              path="/settings"
              element={<Settings allColors={allColors} />}
            />
            <Route
              path="/palette/:paletteId"
              element={<PaletteDetail allColors={allColors} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  )
}

export default App
