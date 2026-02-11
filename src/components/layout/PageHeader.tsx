import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  align?: "center" | "left";
  stats?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  align = "center",
  stats,
  actions,
  children,
  className,
}: PageHeaderProps) {
  const isCentered = align === "center";

  return (
    <section
      className={cn("relative overflow-hidden text-primary-foreground", className)}
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-secondary blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-96 h-96 rounded-full bg-secondary blur-3xl" />
      </div>
      <div className={cn("container mx-auto px-4 py-16 lg:py-24 relative z-10", isCentered ? "text-center" : "text-left")}>
        {children && <div className={cn("mb-4", isCentered ? "flex justify-center" : "")}>{children}</div>}
        <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
          {title}
        </h1>
        {description && (
          <p className={cn("mt-4 text-primary-foreground/80 text-lg max-w-2xl", isCentered ? "mx-auto" : "")}>
            {description}
          </p>
        )}
        {stats && <div className={cn("mt-6 flex flex-wrap gap-8 text-primary-foreground", isCentered ? "justify-center" : "")}>{stats}</div>}
        {actions && <div className={cn("mt-6 flex flex-wrap gap-4", isCentered ? "justify-center" : "")}>{actions}</div>}
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}
