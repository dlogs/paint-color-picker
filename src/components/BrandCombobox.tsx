"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { storageService } from "@/services/storage-service";

const BRANDS = [
  { value: "Benjamin Moore", label: "Benjamin Moore" },
  { value: "Sherwin Williams", label: "Sherwin Williams" },
];

interface BrandComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function BrandCombobox({ value, onChange, className }: BrandComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [customBrands, setCustomBrands] = React.useState<string[]>(() =>
    storageService.loadCustomBrands(),
  );

  const allKnownValues = new Set([...BRANDS.map((b) => b.value), ...customBrands]);
  const selectedBrand = BRANDS.find((brand) => brand.value === value);
  const isCustomValue = value && !allKnownValues.has(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-background border-input", className)}
        >
          {value ? (selectedBrand ? selectedBrand.label : value) : "Select brand..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Search brand..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  const trimmed = searchValue.trim();
                  if (!trimmed) return;
                  const updated = [...customBrands, trimmed];
                  setCustomBrands(updated);
                  storageService.saveCustomBrands(updated);
                  onChange(trimmed);
                  setOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Add "{searchValue}"
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {BRANDS.map((brand) => (
                <CommandItem
                  key={brand.value}
                  value={brand.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === brand.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {brand.label}
                </CommandItem>
              ))}
              {customBrands.map((brand) => (
                <CommandItem
                  key={brand}
                  value={brand}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === brand ? "opacity-100" : "opacity-0")}
                  />
                  {brand}
                </CommandItem>
              ))}
              {isCustomValue && (
                <CommandItem
                  key={value}
                  value={value}
                  onSelect={() => {
                    setOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-100" />
                  {value} (Custom)
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
