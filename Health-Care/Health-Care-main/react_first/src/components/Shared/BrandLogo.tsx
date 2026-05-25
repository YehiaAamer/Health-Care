import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  to?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function BrandLogo({
  to = "/home",
  className,
  iconClassName,
  textClassName,
}: BrandLogoProps) {
  return (
    <Link
      to={to}
      className={cn(
        "flex w-fit items-center gap-2 text-primary transition-colors hover:text-primary/85",
        className
      )}
    >
      <Activity
        className={cn("h-8 w-8 shrink-0 text-primary", iconClassName)}
      />

      <span
        className={cn(
          "whitespace-nowrap text-xl font-semibold leading-none tracking-tight text-primary",
          textClassName
        )}
      >
        HealthCare
      </span>
    </Link>
  );
}