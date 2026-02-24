import { useState, useMemo, useEffect } from 'react';
import type { Swatch } from '@/types/swatch';

export function useColorFilters(colors: Swatch[]) {
    const [brandFilter, setBrandFilter] = useState<string>('all');
    const [collectionFilter, setCollectionFilter] = useState<string>('all');
    const [hueRange, setHueRange] = useState<[number, number]>([0, 360]);
    const [chromaRange, setChromaRange] = useState<[number, number]>([0, 1]);
    const [lightnessRange, setLightnessRange] = useState<[number, number]>([0, 1]);

    // Derived filter options
    const brands = useMemo(() => Array.from(new Set(colors.map(c => c.brand || 'Unknown'))), [colors]);
    const collections = useMemo(() => Array.from(new Set(colors.map(c => c.collection || 'General'))), [colors]);

    // Max chroma from the actual loaded colors (OKLCh C channel)
    const maxChroma = useMemo(() => {
        if (colors.length === 0) return 0.4;
        return Math.ceil(Math.max(...colors.map(c => c.oklch[1])) * 1000) / 1000;
    }, [colors]);

    // Reset chroma range when colors change (new palette loaded)
    useEffect(() => {
        setChromaRange([0, maxChroma]);
    }, [maxChroma]);

    const filteredColors = useMemo(() => {
        return colors.filter(color => {
            const brandMatch = brandFilter === 'all' || (color.brand || 'Unknown') === brandFilter;
            const collectionMatch = collectionFilter === 'all' || (color.collection || 'General') === collectionFilter;

            const [okL, okC, okH] = color.oklch;
            const hueMatch = hueRange[0] <= hueRange[1]
                ? okH >= hueRange[0] && okH <= hueRange[1]
                : okH >= hueRange[0] || okH <= hueRange[1];
            const chromaMatch = okC >= chromaRange[0] && okC <= chromaRange[1];
            const lightnessMatch = okL >= lightnessRange[0] && okL <= lightnessRange[1];

            return brandMatch && collectionMatch && hueMatch && chromaMatch && lightnessMatch;
        });
    }, [colors, brandFilter, collectionFilter, hueRange, chromaRange, lightnessRange]);

    const handleReset = () => {
        setBrandFilter('all');
        setCollectionFilter('all');
        setHueRange([0, 360]);
        setChromaRange([0, maxChroma]);
        setLightnessRange([0, 1]);
    };

    return {
        brandFilter, setBrandFilter,
        collectionFilter, setCollectionFilter,
        hueRange, setHueRange,
        chromaRange, setChromaRange,
        lightnessRange, setLightnessRange,
        brands,
        collections,
        maxChroma,
        filteredColors,
        handleReset
    };
}
