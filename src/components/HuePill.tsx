import { cn } from "@/lib/utils";

interface HuePillProps {
  hue: number;
  className?: string;
}

/**
 * A reusable component that displays a hue value inside a color-coded pill.
 * The background color is dynamically generated based on the oklch hue value.
 */
export function HuePill({ hue, className }: HuePillProps) {
  const roundedHue = Math.round(hue);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-mono font-black text-white rounded-full border border-white/20 whitespace-nowrap",
        className,
      )}
      style={{
        backgroundColor: `oklch(70% 0.2 ${roundedHue})`,
        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
      }}
    >
      {roundedHue}°
    </div>
  );
}
