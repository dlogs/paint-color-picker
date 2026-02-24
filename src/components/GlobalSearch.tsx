import * as React from "react"
import { useNavigate } from "react-router"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import type { Swatch } from "@/types/swatch"
import { cn } from "@/lib/utils"

interface GlobalSearchProps {
    colors: Swatch[]
}

export function GlobalSearch({ colors }: GlobalSearchProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const navigate = useNavigate()

    // We'll limit the search results to keep it performant
    const filteredColors = React.useMemo(() => {
        if (!value) return []
        const words = value.toLowerCase().split(/\s+/).filter(Boolean)
        return colors
            .filter((c) => {
                const target = `${c.name} ${c.number || ""} ${c.brand}`.toLowerCase()
                return words.every((word) => target.includes(word))
            })
            .slice(0, 50)
    }, [colors, value])

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <Command
                className="rounded-xl border shadow-2xl bg-card overflow-visible"
                shouldFilter={false} // We handle filtering ourselves for more control
            >
                <CommandInput
                    placeholder="Search colors by name or number (e.g. 'White Dove' or 'SW 7005')..."
                    value={value}
                    onValueChange={setValue}
                    onFocus={() => setOpen(true)}
                    className="h-14 text-lg"
                />
                {open && value && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-card rounded-xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <CommandList className="max-h-[min(500px,60vh)] p-2">
                            <CommandEmpty className="py-12 text-center">
                                <div className="text-4xl mb-4 opacity-20">🎨</div>
                                <p className="text-muted-foreground">No colors found for "{value}"</p>
                            </CommandEmpty>
                            <CommandGroup heading={`${filteredColors.length} Results`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                                    {filteredColors.map((color) => (
                                        <CommandItem
                                            key={color.id}
                                            value={`${color.name} ${color.number || ""}`}
                                            onSelect={() => {
                                                navigate(`/color/${color.id}`)
                                                setOpen(false)
                                                setValue("")
                                            }}
                                            className="p-0 aria-selected:bg-transparent" // Disable default backdrop
                                        >
                                            <div
                                                className="w-full flex items-center gap-4 p-3 rounded-lg border border-white/10 transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden active:scale-95"
                                                style={{ backgroundColor: `rgb(${color.rgb.join(",")})` }}
                                            >
                                                {/* Contrast overlay */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                                                <div className={cn(
                                                    "relative z-10 flex flex-col min-w-0 px-1 py-0.5 rounded-md",
                                                    // Contrast helper based on lightness
                                                    color.oklch[0] < 0.6 ? "text-white" : "text-black"
                                                )}>
                                                    <span className="font-bold truncate text-sm">
                                                        {color.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 opacity-70">
                                                        {color.number && (
                                                            <span className="text-[10px] font-mono leading-none border-r border-current pr-2">
                                                                {color.number}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] uppercase tracking-wider font-bold truncate">
                                                            {color.brand}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </div>
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </Command>

            {/* Click away listener overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setOpen(false)}
                />
            )}
        </div>
    )
}
