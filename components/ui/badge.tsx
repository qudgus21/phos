import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "violet" | "blue" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  violet: "bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400",
  blue: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
  outline: "border border-border text-muted-foreground",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-bold rounded-full",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
