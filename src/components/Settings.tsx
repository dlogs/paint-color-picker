import { useMemo } from "react";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import type { Swatch } from "@/types/swatch";

interface SettingsProps {
  allColors: Swatch[];
}

export default function Settings({ allColors }: SettingsProps) {
  const { settings, toggleCollection } = useGlobalSettings();

  const uniqueCollections = useMemo(() => {
    const collections = new Set<string>();
    allColors.forEach((c) => collections.add(`${c.brand} - ${c.collection}`));
    return Array.from(collections).sort();
  }, [allColors]);

  // Group collections by brand
  const groupedCollections = useMemo(() => {
    const groups: Record<string, string[]> = {};
    uniqueCollections.forEach((c) => {
      const [brand] = c.split(" - ");
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(c);
    });
    return groups;
  }, [uniqueCollections]);

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Active Collections</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Globally filter which paint collections are shown across the app. Uncheck a collection
            to hide its colors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(groupedCollections).map(([brand, collections]) => (
              <div key={brand} className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">{brand}</h3>
                <div className="space-y-3">
                  {collections.map((collectionId) => {
                    const [, collectionName] = collectionId.split(" - ");
                    const isChecked = !settings.disabledCollections.includes(collectionId);
                    return (
                      <div key={collectionId} className="flex items-center space-x-3">
                        <Checkbox
                          id={collectionId}
                          checked={isChecked}
                          onCheckedChange={() => toggleCollection(collectionId)}
                        />
                        <Label
                          htmlFor={collectionId}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {collectionName}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
