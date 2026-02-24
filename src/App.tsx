import { useState, useEffect } from 'react'
import ColorTable from './components/ColorTable'
import { fetchBuiltInSwatches } from './services/swatch-provider'
import type { Swatch } from './types/swatch'
import ColorDetail from './components/ColorDetail'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GlobalSearch } from './components/GlobalSearch'


function App() {
  const [builtInColors, setBuiltInColors] = useState<Swatch[]>([])
  const allColors = [...builtInColors]

  // Load built-in colors from bundled JSON assets
  useEffect(() => {
    fetchBuiltInSwatches().then(setBuiltInColors)
  }, [])

  return (
    <BrowserRouter>
      <main className="min-h-screen bg-background text-foreground py-12 px-4 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-8">
          {/* Top Bar with Global Search */}
          <GlobalSearch colors={allColors} />

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
        </div>
      </main>
    </BrowserRouter>
  )
}

export default App
