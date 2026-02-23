import { useState, useEffect } from 'react'
import ColorTable from './components/ColorTable'
import AddPaletteModal from './components/AddPaletteModal'
import { storageService } from './services/storage-service'
import { loadBuiltInSwatchs, type Swatch } from './services/swatch-assets'
import { Button } from './components/ui/button'
import ColorDetail from './components/ColorDetail'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'


function App() {
  const [builtInColors, setBuiltInColors] = useState<Swatch[]>([])
  const [userColors, setUserColors] = useState<Swatch[]>(() => storageService.loadPalettes())
  const allColors = [...builtInColors, ...userColors]

  // Load built-in colors from bundled JSON assets
  useEffect(() => {
    loadBuiltInSwatchs().then(setBuiltInColors)
  }, [])

  // Persist user-added palettes to localStorage
  useEffect(() => {
    storageService.savePalettes(userColors)
  }, [userColors])

  const handlePalettesAdded = (newColors: Swatch[]) => {
    setUserColors(prev => [...prev, ...newColors])
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all user-added palettes? Built-in collections will remain.')) {
      setUserColors([])
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8">
        <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm backdrop-blur-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{allColors.length}</span>
            <span className="text-muted-foreground uppercase text-xs font-bold tracking-widest text-[10px]">Total Colors</span>
          </div>
          <div className="flex gap-4">
            {userColors.length > 0 && (
              <Button variant="ghost" onClick={handleClearAll} className="text-muted-foreground hover:text-destructive">
                Clear User Palettes
              </Button>
            )}
            <AddPaletteModal onPalettesAdded={handlePalettesAdded} />
          </div>
        </div>

        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                allColors.length > 0 ? (
                  <div className="bg-card rounded-xl border shadow-sm p-6">
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
                <ColorDetail allColors={allColors} />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </main>
  )
}

export default App
