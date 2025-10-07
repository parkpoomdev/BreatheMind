import { useMemo } from "react";

type PhaseSegmentsRingProps = {
  ratios: number[];
  progress: number;
  size?: number;
  strokeWidth?: number;
};

const COLORS = ["#60a5fa", "#f59e0b", "#f472b6", "#a855f7", "#22d3ee"];

export function PhaseSegmentsRing({ ratios, progress, size = 180, strokeWidth = 12 }: PhaseSegmentsRingProps) {
  const segments = useMemo(() => {
    const valid = ratios.filter((value) => Number.isFinite(value) && value > 0);
    const total = valid.reduce((sum, value) => sum + value, 0);
    if (!total || !valid.length) {
      return [];
    }
    let cursor = 0;
    return valid.map((value, index) => {
      const fraction = value / total;
      const start = cursor;
      cursor += fraction;
      return { start, fraction, color: COLORS[index % COLORS.length] };
    });
  }, [ratios]);

  const radius = useMemo(() => Math.max(0, (size - strokeWidth) / 2), [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const clampedProgress = Math.max(0, Math.min(1, progress));

  if (!segments.length || radius <= 0 || circumference <= 0) {
    return null;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="phase-segments-ring" aria-hidden="true">
      {segments.map((segment, index) => {
        const segmentLength = Math.max(0, segment.fraction * circumference);
        if (segmentLength <= 0) {
          return null;
        }

        const dashArrayBase = `${segmentLength} ${circumference - segmentLength}`;
        const dashOffset = -(segment.start * circumference);

        const segmentProgress =
          segment.fraction > 0 ? Math.max(0, Math.min(1, (clampedProgress - segment.start) / segment.fraction)) : 0;
        const activeLength = Math.max(0, Math.min(segmentLength, segmentLength * segmentProgress));
        const dashArrayActive = `${activeLength} ${circumference - activeLength}`;

        return (
          <g key={`${segment.color}-${index}`}>
            <circle
              className="phase-segments-ring__base"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArrayBase}
              strokeDashoffset={dashOffset}
            />
            <circle
              className="phase-segments-ring__active"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArrayActive}
              strokeDashoffset={dashOffset}
            />
          </g>
        );
      })}
    </svg>
  );
}
