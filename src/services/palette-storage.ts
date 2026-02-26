import type { Palette } from "../types/palette";
import Sqids from "sqids";

const PALETTES_STORAGE_KEY = "pcp_palettes";
const sqids = new Sqids({ minLength: 4 });

// Reactivity system
type Listener = () => void;
let listeners: Listener[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getPalettes(): Palette[] {
  try {
    const data = localStorage.getItem(PALETTES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse palettes from local storage", e);
    return [];
  }
}

export function savePalettes(palettes: Palette[]): void {
  try {
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(palettes));
    notify();
  } catch (e) {
    console.error("Failed to save palettes to local storage", e);
  }
}

export function createPalette(name: string): Palette {
  const palettes = getPalettes();
  const newPalette: Palette = {
    id: sqids.encode([palettes.length + 1 + (Date.now() % 1000)]), // Add salt to avoid collisions on quick creation
    name,
    createdAt: Date.now(),
    swatches: [],
  };
  palettes.push(newPalette);
  savePalettes(palettes);
  return newPalette;
}

export function deletePalette(id: string): void {
  const palettes = getPalettes();
  const filtered = palettes.filter((p) => p.id !== id);
  savePalettes(filtered);
}

export function addSwatchToPalette(paletteId: string, swatchId: string): void {
  const palettes = getPalettes();
  const palette = palettes.find((p) => p.id === paletteId);
  if (palette && !palette.swatches.includes(swatchId)) {
    palette.swatches.push(swatchId);
    savePalettes(palettes);
  }
}

export function removeSwatchFromPalette(paletteId: string, swatchId: string): void {
  const palettes = getPalettes();
  const palette = palettes.find((p) => p.id === paletteId);
  if (palette) {
    palette.swatches = palette.swatches.filter((id) => id !== swatchId);
    savePalettes(palettes);
  }
}

export function moveSwatchInPalette(
  paletteId: string,
  swatchId: string,
  direction: "left" | "right",
): void {
  const palettes = getPalettes();
  const palette = palettes.find((p) => p.id === paletteId);
  if (!palette) return;

  const currentIndex = palette.swatches.indexOf(swatchId);
  if (currentIndex === -1) return;

  const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0 || newIndex >= palette.swatches.length) return;

  const temp = palette.swatches[currentIndex];
  palette.swatches[currentIndex] = palette.swatches[newIndex];
  palette.swatches[newIndex] = temp;

  savePalettes(palettes);
}
