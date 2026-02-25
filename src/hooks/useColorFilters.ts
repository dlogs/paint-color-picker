import { useState, useMemo, useEffect } from 'react';
import type { Swatch } from '@/types/swatch';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useSearchParams } from 'react-router';

export function useColorFilters(colors: Swatch[]) {
    const [searchParams, setSearchParams] = useSearchParams();

    const [collectionFilter, setCollectionFilter] = useState<string>('all');
    const [hueRange, setHueRange] = useState<[number, number]>([0, 360]);
    const [chromaRange, setChromaRange] = useState<[number, number]>([0, 1]);
    const [lightnessRange, setLightnessRange] = useState<[number, number]>([0, 1]);

    // Derived filter options
    const collections = useMemo(() => {
        const unique = new Set<string>();
        colors.forEach(c => unique.add(`${c.brand} - ${c.collection || 'General'}`));
        return Array.from(unique);
    }, [colors]);

    // Max chroma from the actual loaded colors (OKLCh C channel)
    const maxChroma = useMemo(() => {
        if (colors.length === 0) return 0.4;
        return Math.ceil(Math.max(...colors.map(c => c.oklch[1])) * 1000) / 1000;
    }, [colors]);

    // Initialize from URL params and handle maxChroma fallback
    useEffect(() => {
        const hLo = searchParams.get('hLo');
        const hHi = searchParams.get('hHi');
        const cLo = searchParams.get('cLo');
        const cHi = searchParams.get('cHi');
        const lLo = searchParams.get('lLo');
        const lHi = searchParams.get('lHi');

        if (hLo !== null && hHi !== null) {
            setHueRange([parseFloat(hLo), parseFloat(hHi)]);
        }

        if (cLo !== null && cHi !== null) {
            setChromaRange([parseFloat(cLo), parseFloat(cHi)]);
        } else {
            setChromaRange([0, maxChroma]);
        }

        if (lLo !== null && lHi !== null) {
            setLightnessRange([parseFloat(lLo), parseFloat(lHi)]);
        }
    }, [searchParams, maxChroma]);

    const { settings } = useGlobalSettings();

    const filteredColors = useMemo(() => {
        return colors.filter(color => {
            const collectionId = `${color.brand} - ${color.collection || 'General'}`;
            if (settings.disabledCollections.includes(collectionId)) {
                return false;
            }

            const collectionMatch = collectionFilter === 'all' || collectionId === collectionFilter;

            const [okL, okC, okH] = color.oklch;
            const hueMatch = hueRange[0] <= hueRange[1]
                ? okH >= hueRange[0] && okH <= hueRange[1]
                : okH >= hueRange[0] || okH <= hueRange[1];
            const chromaMatch = okC >= chromaRange[0] && okC <= chromaRange[1];
            const lightnessMatch = okL >= lightnessRange[0] && okL <= lightnessRange[1];

            return collectionMatch && hueMatch && chromaMatch && lightnessMatch;
        });
    }, [colors, settings.disabledCollections, collectionFilter, hueRange, chromaRange, lightnessRange]);

    const handleReset = () => {
        setCollectionFilter('all');
        setHueRange([0, 360]);
        setChromaRange([0, maxChroma]);
        setLightnessRange([0, 1]);
        setSearchParams({});
    };

    return {
        collectionFilter, setCollectionFilter,
        hueRange, setHueRange,
        chromaRange, setChromaRange,
        lightnessRange, setLightnessRange,
        collections,
        maxChroma,
        filteredColors,
        handleReset
    };
}
