import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

// Legacy badge with explicit color — kept for chart/integration components that pass brand colors
export function Badge({ children, color, className }: BadgeProps) {
  if (color) {
    return (
      <span
        className={cn("rounded px-2 py-0.5 text-xs font-mono font-medium", className)}
        style={{ backgroundColor: `${color}18`, color }}
      >
        {children}
      </span>
    );
  }
  return (
    <span className={cn("badge-secondary text-xs font-mono font-medium px-2 py-0.5 rounded", className)}>
      {children}
    </span>
  );
}
