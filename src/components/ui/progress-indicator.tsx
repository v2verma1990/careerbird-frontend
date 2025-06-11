import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  colorScheme?: "blue" | "green" | "amber";
  className?: string;
  labelClassName?: string;
  ariaLabel?: string;
}

/**
 * An accessible progress indicator component with customizable appearance
 */
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  showLabel = true,
  size = "md",
  colorScheme = "blue",
  className,
  labelClassName,
  ariaLabel
}) => {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  // Determine height based on size
  const heightClass = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  }[size];
  
  // Determine color based on scheme
  const colorClass = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    amber: "bg-amber-500"
  }[colorScheme];
  
  // Determine label color
  const labelColorClass = {
    blue: "text-blue-700",
    green: "text-green-700",
    amber: "text-amber-700"
  }[colorScheme];
  
  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span 
            className={cn("text-sm font-medium", labelColorClass, labelClassName)}
            id={`progress-label-${ariaLabel || "progress"}`}
          >
            {normalizedValue}% Complete
          </span>
        </div>
      )}
      <Progress 
        value={normalizedValue} 
        className={cn(heightClass, className)}
        aria-labelledby={showLabel ? `progress-label-${ariaLabel || "progress"}` : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      />
    </div>
  );
};

export { ProgressIndicator };