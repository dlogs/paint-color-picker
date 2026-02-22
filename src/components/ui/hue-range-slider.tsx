import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface HueRangeSliderProps {
    value: [number, number];
    onValueChange: (value: [number, number]) => void;
    className?: string;
}

export function HueRangeSlider({
    value,
    onValueChange,
    className,
}: HueRangeSliderProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const isFullRange = value[0] === 0 && value[1] === 360;

    const [activeThumb, setActiveThumb] = useState<number | null>(null);

    const calculateAngle = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return 0;
        // Convert screen coords into the SVG's own coordinate space.
        // This correctly handles any CSS transforms, zoom, or DPR scaling.
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) return 0;
        const svgPt = pt.matrixTransform(ctm.inverse());

        // Derive center from the SVG's own viewBox so this doesn't depend on
        // the render-phase `center` constant declared below.
        const vb = svgRef.current.viewBox.baseVal;
        const svgCenter = { x: vb.x + vb.width / 2, y: vb.y + vb.height / 2 };

        const x = svgPt.x - svgCenter.x;
        const y = svgPt.y - svgCenter.y;
        let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;
        if (angle >= 360) angle -= 360;
        return angle;
    }, []);

    const handleUpdate = useCallback(
        (angle: number) => {
            if (activeThumb === null) return;

            const newValue = [...value] as [number, number];
            newValue[activeThumb] = Math.round(angle);

            // If we were at full range, we should have already initialized
            // but just in case, ensure we don't stay 0-360
            if (newValue[0] === 0 && newValue[1] === 360) {
                newValue[1] = 359; // Tiny gap to prevent snapping back to "full"
            }

            onValueChange(newValue);
        },
        [activeThumb, value, onValueChange]
    );

    useEffect(() => {
        if (activeThumb === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleUpdate(calculateAngle(e.clientX, e.clientY));
        };

        const handleMouseUp = () => {
            setActiveThumb(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        // Support touch
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                handleUpdate(calculateAngle(e.touches[0].clientX, e.touches[0].clientY));
            }
        };
        const handleTouchEnd = () => {
            setActiveThumb(null);
        };
        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [activeThumb, calculateAngle, handleUpdate]);

    const size = 180;
    const trackWidth = 14;
    const radius = (size - trackWidth) / 2 - 4;
    const center = size / 2;

    const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + r * Math.cos(angleInRadians),
            y: centerY + r * Math.sin(angleInRadians)
        };
    };

    const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
        // SVG Arc is clockwise from start to end
        const start = polarToCartesian(x, y, r, endAngle);
        const end = polarToCartesian(x, y, r, startAngle);

        let diff = endAngle - startAngle;
        if (diff < 0) diff += 360;

        const largeArcFlag = diff <= 180 ? "0" : "1";

        return [
            "M", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    };

    const thumb0 = polarToCartesian(center, center, radius, value[0]);
    const thumb1 = polarToCartesian(center, center, radius, value[1]);

    return (
        <div className={cn("relative flex items-center justify-center select-none group", className)} style={{ width: size, height: size }}>
            {/* CSS Track Background */}
            <div
                className="absolute rounded-full border border-slate-700/50 shadow-inner"
                style={{
                    width: radius * 2 + trackWidth,
                    height: radius * 2 + trackWidth,
                    background: `conic-gradient(from 0deg, 
            hsl(0, 100%, 50%), 
            hsl(60, 100%, 50%), 
            hsl(120, 100%, 50%), 
            hsl(180, 100%, 50%), 
            hsl(240, 100%, 50%), 
            hsl(300, 100%, 50%), 
            hsl(360, 100%, 50%))`,
                    opacity: isFullRange ? 0.3 : 1,
                    transition: 'opacity 0.3s ease'
                }}
            />

            {/* Inner Mask/Hole */}
            <div
                className="absolute rounded-full bg-slate-900 border border-slate-700/50 shadow-xl flex items-center justify-center p-4 ring-1 ring-white/5 z-10"
                style={{
                    width: radius * 2 - trackWidth,
                    height: radius * 2 - trackWidth,
                }}
            >
                <div className="flex flex-col items-center justify-center">
                    <div
                        className="w-12 h-12 rounded-full border-2 border-slate-600/50 shadow-lg flex items-center justify-center p-2 text-[10px] text-center font-bold text-slate-400"
                        style={{
                            background: isFullRange
                                ? 'transparent'
                                : `linear-gradient(135deg, hsl(${value[0]}, 100%, 50%), hsl(${value[1]}, 100%, 50%))`
                        }}
                    >
                        {isFullRange && "ALL COLORS"}
                    </div>
                    {!isFullRange && (
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-2 font-bold tabular-nums">
                            {Math.round(value[0])}° – {Math.round(value[1])}°
                        </div>
                    )}
                </div>
            </div>

            <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="absolute inset-0 overflow-visible z-20"
                onMouseDown={(e) => {
                    const angle = calculateAngle(e.clientX, e.clientY);

                    if (isFullRange) {
                        // Initialize a 45 degree range around the click
                        let start = angle - 22.5;
                        let end = angle + 22.5;
                        if (start < 0) start += 360;
                        if (end >= 360) end -= 360;
                        onValueChange([Math.round(start), Math.round(end)]);
                        setActiveThumb(1); // Set focus to the end handle
                        return;
                    }

                    const d0 = Math.abs(angle - value[0]);
                    const d1 = Math.abs(angle - value[1]);
                    const dist0 = Math.min(d0, 360 - d0);
                    const dist1 = Math.min(d1, 360 - d1);

                    const thumbIndex = dist0 < dist1 ? 0 : 1;
                    setActiveThumb(thumbIndex);
                    handleUpdate(angle);
                }}
                onTouchStart={(e) => {
                    if (e.touches[0]) {
                        const angle = calculateAngle(e.touches[0].clientX, e.touches[0].clientY);

                        if (isFullRange) {
                            let start = angle - 22.5;
                            let end = angle + 22.5;
                            if (start < 0) start += 360;
                            if (end >= 360) end -= 360;
                            onValueChange([Math.round(start), Math.round(end)]);
                            setActiveThumb(1);
                            return;
                        }

                        const d0 = Math.abs(angle - value[0]);
                        const d1 = Math.abs(angle - value[1]);
                        const dist0 = Math.min(d0, 360 - d0);
                        const dist1 = Math.min(d1, 360 - d1);

                        const thumbIndex = dist0 < dist1 ? 0 : 1;
                        setActiveThumb(thumbIndex);
                    }
                }}
            >
                {/* Range Highlight Arc */}
                {!isFullRange && (
                    <path
                        d={describeArc(center, center, radius, value[0], value[1])}
                        fill="none"
                        stroke="white"
                        strokeWidth={trackWidth + 6}
                        strokeOpacity={0.4}
                        strokeLinecap="round"
                        className="pointer-events-none"
                    />
                )}

                {/* Thumbs - only show if not full range */}
                {!isFullRange && (
                    <g className="cursor-pointer">
                        {/* Thumb 0 */}
                        <circle
                            cx={thumb0.x}
                            cy={thumb0.y}
                            r={10}
                            fill={`hsl(${value[0]}, 100%, 50%)`}
                            stroke="white"
                            strokeWidth={2}
                            className={cn(
                                "shadow-2xl transition-transform",
                                activeThumb === 0 ? "scale-125" : "hover:scale-110"
                            )}
                            style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))", transformBox: "fill-box", transformOrigin: "center" }}
                        />
                        {/* Thumb 1 */}
                        <circle
                            cx={thumb1.x}
                            cy={thumb1.y}
                            r={10}
                            fill={`hsl(${value[1]}, 100%, 50%)`}
                            stroke="white"
                            strokeWidth={2}
                            className={cn(
                                "shadow-2xl transition-transform",
                                activeThumb === 1 ? "scale-125" : "hover:scale-110"
                            )}
                            style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))", transformBox: "fill-box", transformOrigin: "center" }}
                        />
                    </g>
                )}
            </svg>
        </div>

    );
}
