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
    hasAccent?: boolean
    isDarkAccent?: boolean
}

export function GlobalSearch({ colors, hasAccent, isDarkAccent }: GlobalSearchProps) {
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
                className={cn(
                    "relative z-50 rounded-xl border-2 shadow-2xl overflow-visible transition-all duration-300 backdrop-blur-md",
                    hasAccent
                        ? (isDarkAccent ? "bg-white/10 border-white/20 text-white shadow-none [&_[data-slot=command-input-wrapper]]:border-transparent" : "bg-black/5 border-black/10 text-black shadow-none [&_[data-slot=command-input-wrapper]]:border-transparent")
                        : "bg-card"
                )}
                shouldFilter={false} // We handle filtering ourselves for more control
            >
                <CommandInput
                    placeholder="Search colors by name or number (e.g. 'White Dove' or 'SW 7005')..."
                    value={value}
                    onValueChange={setValue}
                    onFocus={() => setOpen(true)}
                    className={cn(
                        "h-14 text-lg",
                        hasAccent && (isDarkAccent ? "placeholder:text-white/50" : "placeholder:text-black/40")
                    )}
                />
                {open && value && (
                    <div
                        className={cn(
                            "absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border-2 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl",
                            hasAccent
                                ? (isDarkAccent ? "bg-black/80 border-white/20" : "bg-white/80 border-black/20")
                                : "bg-card"
                        )}
                    >
                        <CommandList className="max-h-[min(500px,60vh)] p-2">
                            <CommandEmpty className="py-12 text-center text-current">
                                <div className="text-4xl mb-4 opacity-20">🎨</div>
                                <p className="opacity-70">No colors found for "{value}"</p>
                            </CommandEmpty>
                            <CommandGroup heading={`${filteredColors.length} Results`} className={hasAccent ? (isDarkAccent ? "[&_[cmdk-group-heading]]:text-white/40" : "[&_[cmdk-group-heading]]:text-black/40") : ""}>
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
