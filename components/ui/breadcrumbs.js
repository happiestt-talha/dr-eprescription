import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Breadcrumbs component for nested page orientation.
 *
 * @param {{ segments: Array<{ label: string, href?: string }> }} props
 *   segments — ordered list; last item has no href (current page).
 *
 * Usage:
 *   <Breadcrumbs segments={[
 *     { label: "Doctors", href: "/admin/doctors" },
 *     { label: "Edit Doctor" },
 *   ]} />
 */
export function Breadcrumbs({ segments }) {
  if (!segments || segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
            {seg.href && !isLast ? (
              <Link
                href={seg.href}
                className="hover:text-foreground transition-colors truncate max-w-[160px]"
              >
                {seg.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium truncate max-w-[200px]" : "truncate max-w-[160px]"}>
                {seg.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
