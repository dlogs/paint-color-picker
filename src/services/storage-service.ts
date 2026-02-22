import { type AseColor } from '../util/ase-parser';

const STORAGE_KEY = 'paint-color-picker-palettes';

export const storageService = {
    savePalettes: (colors: AseColor[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
        } catch (err) {
            console.error('Failed to save to localStorage:', err);
        }
    },

    loadPalettes: (): AseColor[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (err) {
            console.error('Failed to load from localStorage:', err);
        }
        return [];
    },

    clearPalettes: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
