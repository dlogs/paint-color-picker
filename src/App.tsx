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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu'

function App() {
  const [builtInColors, setBuiltInColors] = useState<Swatch[]>([])
  const allColors = [...builtInColors]
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [isDarkAccent, setIsDarkAccent] = useState(false)

  const textColor = accentColor ? (isDarkAccent ? 'text-white' : 'text-black') : 'text-foreground'
  const buttonClass = accentColor
    ? (isDarkAccent
      ? 'bg-white/10 hover:!bg-white/20 border-white/20 text-white shadow-none'
      : 'bg-black/5 hover:!bg-black/10 border-black/10 text-black shadow-none')
    : 'bg-card hover:bg-muted border-2'

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
          <div className={`flex flex-row items-center gap-2 sm:gap-4 w-full ${textColor}`}>
            <div className="flex-1 w-full relative">
              <GlobalSearch colors={allColors} hasAccent={!!accentColor} isDarkAccent={isDarkAccent} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant={accentColor ? "ghost" : "outline"} className={`h-14 px-6 rounded-xl font-bold text-lg gap-2 transition-all backdrop-blur-md ${buttonClass}`}>
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

                <Button asChild variant={accentColor ? "ghost" : "outline"} className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-all backdrop-blur-md ${buttonClass}`}>
                  <Link to="/settings" aria-label="Settings">
                    <SettingsIcon className="w-6 h-6" />
                  </Link>
                </Button>
              </div>

              {/* Mobile Hamburger Menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={accentColor ? "ghost" : "outline"} className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 transition-all backdrop-blur-md ${buttonClass}`}>
                      <Menu className="w-6 h-6 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={`w-56 p-2 rounded-xl backdrop-blur-xl border-2 ${accentColor ? (isDarkAccent ? 'bg-black/80 border-white/20' : 'bg-white/80 border-black/10') : 'bg-popover'}`}>
                    <Sheet>
                      <SheetTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className={`gap-3 p-3 text-base cursor-pointer rounded-lg font-medium ${textColor} ${accentColor ? (isDarkAccent ? 'hover:!bg-white/10' : 'hover:!bg-black/10') : ''}`}>
                          <PaletteIcon className={`w-5 h-5 ${accentColor ? textColor : 'text-primary'}`} />
                          <span>My Palettes</span>
                        </DropdownMenuItem>
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

                    <DropdownMenuItem asChild className={`gap-3 p-3 text-base cursor-pointer rounded-lg font-medium mt-1 ${textColor} ${accentColor ? (isDarkAccent ? 'hover:!bg-white/10' : 'hover:!bg-black/10') : ''}`}>
                      <Link to="/settings">
                        <SettingsIcon className="w-5 h-5" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
