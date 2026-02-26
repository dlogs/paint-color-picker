import type { Swatch } from "../types/swatch";

const STORAGE_KEY = "paint-color-picker-palettes";
const BRANDS_STORAGE_KEY = "brand-combobox-custom-brands";

export const storageService = {
  savePalettes: (colors: Swatch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  },

  loadPalettes: (): Swatch[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error("Failed to load from localStorage:", err);
    }
    return [];
  },

  clearPalettes: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  loadCustomBrands: (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(BRANDS_STORAGE_KEY) ?? "[]") as string[];
    } catch (err) {
      console.error("Failed to load custom brands:", err);
      return [];
    }
  },

  saveCustomBrands: (brands: string[]) => {
    try {
      localStorage.setItem(BRANDS_STORAGE_KEY, JSON.stringify(brands));
    } catch (err) {
      console.error("Failed to save custom brands:", err);
    }
  },
};
