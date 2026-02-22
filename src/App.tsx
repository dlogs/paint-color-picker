import { useState, useEffect } from 'react'
import ColorTable from './components/ColorTable'
import AddPaletteModal from './components/AddPaletteModal'
import { storageService } from './services/storage-service'
import type { AseColor } from './util/ase-parser'
import { Button } from './components/ui/button'

function App() {
  const [allColors, setAllColors] = useState<AseColor[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load initial data from local storage
  useEffect(() => {
    const storedColors = storageService.loadPalettes()
    setAllColors(storedColors)
    setIsLoaded(true)
  }, [])

  // Save to local storage whenever colors change
  useEffect(() => {
    if (isLoaded) {
      storageService.savePalettes(allColors)
    }
  }, [allColors, isLoaded])

  const handlePalettesAdded = (newColors: AseColor[]) => {
    setAllColors(prev => [...prev, ...newColors])
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all palettes? This cannot be undone.')) {
      setAllColors([])
    }
  }

  return (
    <main className="app-container min-h-screen py-12 px-4 flex flex-col items-center bg-[#0f172a] text-white">
      <header className="animate-fade-in text-center mb-12">
        <h1 className="text-5xl font-black mb-4 tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          HueStore <span className="text-indigo-500">ASE</span>
        </h1>
        <p className="text-slate-400 text-lg">Manage and filter professional Adobe Swatch palettes</p>
      </header>

      <div className="w-full max-w-6xl space-y-8">
        <div className="flex justify-between items-center bg-slate-800/20 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{allColors.length}</span>
            <span className="text-slate-500 uppercase text-xs font-bold tracking-widest text-[10px]">Total Colors</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={handleClearAll} className="text-slate-500 hover:text-red-400">
              Clear Library
            </Button>
            <AddPaletteModal onPalettesAdded={handlePalettesAdded} />
          </div>
        </div>

        {allColors.length > 0 ? (
          <ColorTable colors={allColors} />
        ) : (
          <div className="flex flex-col items-center justify-center p-24 bg-slate-800/10 rounded-3xl border-2 border-dashed border-slate-700/50 animate-fade-in">
            <div className="text-6xl mb-6 opacity-30">🎨</div>
            <h2 className="text-2xl font-semibold text-slate-300 mb-2">Your palette library is empty</h2>
            <p className="text-slate-500 mb-8 max-w-md text-center">
              Start by adding Benjamin Moore, Sherwin-Williams, or any other professional ASE color collections.
            </p>
            <AddPaletteModal onPalettesAdded={handlePalettesAdded} />
          </div>
        )}
      </div>

      <footer className="mt-24 text-slate-600 text-[10px] font-medium uppercase tracking-[0.3em]">
        Professional Color Management System &copy; 2026
      </footer>
    </main>
  )
}

export default App
