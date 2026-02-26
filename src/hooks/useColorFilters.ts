import { useMemo, useCallback } from "react";
import type { Swatch } from "@/types/swatch";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useSearchParams } from "react-router";

export function useColorFilters(colors: Swatch[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Getters derived from URL
  const collectionFilter = searchParams.get("col") || "all";

  // Max chroma from the actual loaded colors (OKLCh C channel)
  const maxChroma = useMemo(() => {
    if (colors.length === 0) return 0.4;
    return Math.ceil(Math.max(...colors.map((c) => c.oklch[1])) * 1000) / 1000;
  }, [colors]);

  const hueRange = useMemo<[number, number]>(() => {
    const hLo = searchParams.get("hLo");
    const hHi = searchParams.get("hHi");
    return [hLo !== null ? parseFloat(hLo) : 0, hHi !== null ? parseFloat(hHi) : 360];
  }, [searchParams]);

  const chromaRange = useMemo<[number, number]>(() => {
    const cLo = searchParams.get("cLo");
    const cHi = searchParams.get("cHi");
    return [cLo !== null ? parseFloat(cLo) : 0, cHi !== null ? parseFloat(cHi) : maxChroma];
  }, [searchParams, maxChroma]);

  const lightnessRange = useMemo<[number, number]>(() => {
    const lLo = searchParams.get("lLo");
    const lHi = searchParams.get("lHi");
    return [lLo !== null ? parseFloat(lLo) : 0, lHi !== null ? parseFloat(lHi) : 1];
  }, [searchParams]);

  // Setters that update URL
  const setCollectionFilter = useCallback(
    (val: string) => {
      setSearchParams((prev) => {
        if (val === "all") prev.delete("col");
        else prev.set("col", val);
        return prev;
      });
    },
    [setSearchParams],
  );

  const setHueRange = useCallback(
    (range: [number, number]) => {
      setSearchParams((prev) => {
        if (range[0] === 0 && range[1] === 360) {
          prev.delete("hLo");
          prev.delete("hHi");
        } else {
          prev.set("hLo", range[0].toFixed(2));
          prev.set("hHi", range[1].toFixed(2));
        }
        return prev;
      });
    },
    [setSearchParams],
  );

  const setChromaRange = useCallback(
    (range: [number, number]) => {
      setSearchParams((prev) => {
        if (range[0] === 0 && Math.abs(range[1] - maxChroma) < 0.001) {
          prev.delete("cLo");
          prev.delete("cHi");
        } else {
          prev.set("cLo", range[0].toFixed(4));
          prev.set("cHi", range[1].toFixed(4));
        }
        return prev;
      });
    },
    [setSearchParams, maxChroma],
  );

  const setLightnessRange = useCallback(
    (range: [number, number]) => {
      setSearchParams((prev) => {
        if (range[0] === 0 && range[1] === 1) {
          prev.delete("lLo");
          prev.delete("lHi");
        } else {
          prev.set("lLo", range[0].toFixed(4));
          prev.set("lHi", range[1].toFixed(4));
        }
        return prev;
      });
    },
    [setSearchParams],
  );

  const collections = useMemo(() => {
    const unique = new Set<string>();
    colors.forEach((c) => unique.add(`${c.brand} - ${c.collection || "General"}`));
    return Array.from(unique);
  }, [colors]);

  const { settings } = useGlobalSettings();

  const filteredColors = useMemo(() => {
    return colors.filter((color) => {
      const collectionId = `${color.brand} - ${color.collection || "General"}`;
      if (settings.disabledCollections.includes(collectionId)) {
        return false;
      }

      const collectionMatch = collectionFilter === "all" || collectionId === collectionFilter;

      const [okL, okC, okH] = color.oklch;
      const hueMatch =
        hueRange[0] <= hueRange[1]
          ? okH >= hueRange[0] && okH <= hueRange[1]
          : okH >= hueRange[0] || okH <= hueRange[1];
      const chromaMatch = okC >= chromaRange[0] && okC <= chromaRange[1];
      const lightnessMatch = okL >= lightnessRange[0] && okL <= lightnessRange[1];

      return collectionMatch && hueMatch && chromaMatch && lightnessMatch;
    });
  }, [
    colors,
    settings.disabledCollections,
    collectionFilter,
    hueRange,
    chromaRange,
    lightnessRange,
  ]);

  const handleReset = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return {
    collectionFilter,
    setCollectionFilter,
    hueRange,
    setHueRange,
    chromaRange,
    setChromaRange,
    lightnessRange,
    setLightnessRange,
    collections,
    maxChroma,
    filteredColors,
    handleReset,
  };
}
