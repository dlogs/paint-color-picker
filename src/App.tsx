import { useState, useEffect } from 'react'
import ColorTable from './components/ColorTable'
import { fetchBuiltInSwatches } from './services/swatch-provider'
import type { Swatch } from './types/swatch'
import ColorDetail from './components/ColorDetail'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import Settings from './components/Settings'
import PaletteDetail from './components/PaletteDetail'
import { Layout } from './components/Layout'
import { cn } from '@/lib/utils'

function App() {
  const [builtInColors, setBuiltInColors] = useState<Swatch[]>([])
  const allColors = [...builtInColors]
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [isDarkAccent, setIsDarkAccent] = useState(false)

  // Load built-in colors from bundled JSON assets
  useEffect(() => {
    fetchBuiltInSwatches().then(setBuiltInColors)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={
          <Layout
            allColors={allColors}
            accentColor={accentColor}
            isDarkAccent={isDarkAccent}
            onAccentChange={(color, isDark) => {
              setAccentColor(color);
              setIsDarkAccent(isDark);
            }}
          />
        }>
          <Route
            path="/"
            element={
              allColors.length > 0 ? (
                <div className={cn("bg-card rounded-xl border shadow-sm p-6", accentColor && 'hidden')}>
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
