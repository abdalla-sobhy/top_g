import { cn } from "@/lib/utils";

export const CircularProgress = ({
  progress,
  onClick,
  size = 60, // Default size (matches your original radius * 2)
  className = "",
  absolute = true,
  position = "top-1 left-1",
  transform = "",
  strokeColor = "#4ade80",
  trackColor = "#ccc",
  textColor = "white",
  textSize = "text-[10px]",
  bgColor = "bg-black/60",
}: {
  progress: number;
  onClick: () => void;
  size?: number;
  className?: string;
  absolute?: boolean;
  position?: string;
  transform?: string;
  strokeColor?: string;
  trackColor?: string;
  textColor?: string;
  textSize?: string;
  bgColor?: string;
}) => {
  const radius = size / 2;
  const stroke = Math.max(3, Math.floor(size / 15)); // Dynamic stroke based on size
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      height={size}
      width={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(
        "cursor-pointer z-10 rounded-full",
        bgColor,
        textColor,
        absolute && "absolute",
        position,
        transform,
        className
      )}
      onClick={onClick}
      style={{ minWidth: size, minHeight: size }}
    >
      <circle
        stroke={trackColor}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={strokeColor}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        transform={`rotate(-90 ${radius} ${radius})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        className={textSize}
        style={{ pointerEvents: "none" }}
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
};
