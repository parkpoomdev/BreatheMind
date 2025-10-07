import { useId, useMemo } from "react";

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
};

export function ProgressRing({ progress, size = 220, strokeWidth = 16 }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const dashOffset = useMemo(() => circumference * (1 - clamped), [circumference, clamped]);
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring" aria-hidden="true">
      <defs>
        <linearGradient id={`ring-gradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(148, 163, 184, 0.25)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#ring-gradient-${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
      />
    </svg>
  );
}
