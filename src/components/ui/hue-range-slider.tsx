import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

interface HueRangeSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  className?: string;
}

export function HueRangeSlider({ value, onValueChange, className }: HueRangeSliderProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isFullRange = value[0] === 0 && value[1] === 360;

  const [activeThumb, setActiveThumb] = useState<number | null>(null);

  // Converts a screen-space pointer position to a hue angle (0–360).
  // Uses the SVG's own CTM so it works correctly under any CSS transform or zoom.
  const calculateAngle = (clientX: number, clientY: number): number => {
    if (!svgRef.current) return 0;
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return 0;
    const svgPt = pt.matrixTransform(ctm.inverse());

    const vb = svgRef.current.viewBox.baseVal;
    const cx = vb.x + vb.width / 2;
    const cy = vb.y + vb.height / 2;

    let angle = (Math.atan2(svgPt.y - cy, svgPt.x - cx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;
    return angle;
  };

  useEffect(() => {
    if (activeThumb === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = [...value] as [number, number];
      newValue[activeThumb] = Math.round(calculateAngle(e.clientX, e.clientY));
      onValueChange(newValue);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const newValue = [...value] as [number, number];
      newValue[activeThumb] = Math.round(
        calculateAngle(e.touches[0].clientX, e.touches[0].clientY),
      );
      onValueChange(newValue);
    };

    const handleEnd = () => setActiveThumb(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThumb]);

  const size = 140;
  const trackWidth = 14;
  const radius = (size - trackWidth) / 2 - 4;
  const center = size / 2;

  const polarToCartesian = (angleInDegrees: number) => {
    const rad = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    let diff = endAngle - startAngle;
    if (diff < 0) diff += 360;
    const largeArcFlag = diff <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    const angle = calculateAngle(clientX, clientY);

    if (isFullRange) {
      // Initialize a 45-degree range centered on the click point
      let start = angle - 22.5;
      let end = angle + 22.5;
      if (start < 0) start += 360;
      if (end >= 360) end -= 360;
      onValueChange([Math.round(start), Math.round(end)]);
      setActiveThumb(1);
      return;
    }

    // Pick whichever thumb is angularly closer (accounts for wrap-around)
    const d0 = Math.abs(angle - value[0]);
    const d1 = Math.abs(angle - value[1]);
    const dist0 = Math.min(d0, 360 - d0);
    const dist1 = Math.min(d1, 360 - d1);
    setActiveThumb(dist0 < dist1 ? 0 : 1);
  };

  const thumb0 = polarToCartesian(value[0]);
  const thumb1 = polarToCartesian(value[1]);

  const thumbStyle = {
    filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))",
    transformBox: "fill-box" as const,
    transformOrigin: "center",
  };

  return (
    <div
      className={cn("relative flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      {/* Rainbow track ring */}
      <div
        className="absolute rounded-full border border-border/50 shadow-inner"
        style={{
          width: radius * 2 + trackWidth,
          height: radius * 2 + trackWidth,
          background: `conic-gradient(from 0deg,
                        oklch(70% 0.2 0), oklch(70% 0.2 60), oklch(70% 0.2 120),
                        oklch(70% 0.2 180), oklch(70% 0.2 240), oklch(70% 0.2 300), oklch(70% 0.2 360))`,
          opacity: isFullRange ? 0.7 : 1,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Inner hole container (Visual only, behind SVG) */}
      <div
        className="absolute rounded-full bg-background border border-border/50 flex items-center justify-center ring-1 ring-white/5 z-10"
        style={{ width: radius * 2 - trackWidth, height: radius * 2 - trackWidth }}
      >
        {!isFullRange && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-12 font-bold tabular-nums pt-3">
            {Math.round(value[0])}° – {Math.round(value[1])}°
          </div>
        )}
      </div>

      {/* Reset Button (Interaction only, on top of SVG, confined to center) */}
      <div
        className="absolute z-50 flex items-center justify-center pointer-events-none"
        style={{ width: size, height: size }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full border-2 border-muted-foreground/50 shadow-lg flex items-center justify-center p-2 text-[10px] text-center font-bold text-muted-foreground transition-all group pointer-events-auto",
            !isFullRange && "cursor-pointer hover:brightness-110 active:scale-90",
          )}
          style={{
            background: isFullRange
              ? "transparent"
              : `linear-gradient(135deg, oklch(70% 0.2 ${value[0]}), oklch(70% 0.2 ${value[1]}))`,
          }}
          onClick={(e) => {
            if (!isFullRange) {
              e.stopPropagation();
              onValueChange([0, 360]);
            }
          }}
        >
          {isFullRange ? (
            <div className="text-[9px] leading-tight opacity-50 uppercase tracking-tighter">
              All
              <br />
              Colors
            </div>
          ) : (
            <RotateCcw className="w-5 h-5 text-white drop-shadow-md group-hover:rotate-[-45deg] transition-transform" />
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 overflow-visible z-20"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
      >
        {/* Selected range arc highlight */}
        {!isFullRange && (
          <path
            d={describeArc(value[0], value[1])}
            fill="none"
            stroke="white"
            strokeWidth={trackWidth + 6}
            strokeOpacity={0.4}
            strokeLinecap="round"
            className="pointer-events-none"
          />
        )}

        {/* Thumb handles */}
        {!isFullRange && (
          <g className="cursor-pointer">
            <circle
              cx={thumb0.x}
              cy={thumb0.y}
              r={10}
              fill={`oklch(70% 0.2 ${value[0]})`}
              stroke="white"
              strokeWidth={2}
              className={cn(
                "shadow-2xl transition-transform",
                activeThumb === 0 ? "scale-125" : "hover:scale-110",
              )}
              style={thumbStyle}
            />
            <circle
              cx={thumb1.x}
              cy={thumb1.y}
              r={10}
              fill={`oklch(70% 0.2 ${value[1]})`}
              stroke="white"
              strokeWidth={2}
              className={cn(
                "shadow-2xl transition-transform",
                activeThumb === 1 ? "scale-125" : "hover:scale-110",
              )}
              style={thumbStyle}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
