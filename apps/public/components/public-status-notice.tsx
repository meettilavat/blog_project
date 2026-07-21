import type { ReactNode } from "react";
import { cn } from "@/lib/ui/classnames";

type PublicStatusNoticeProps = {
  label: string;
  title: string;
  description: string;
  children?: ReactNode;
  headingLevel?: "h1" | "h2";
  className?: string;
};

export const publicStatusActionClass =
  "inline-flex min-h-11 items-center gap-2 border-b border-accent/65 font-mono text-[10px] font-semibold uppercase tracking-[0.17em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";

export function PublicStatusNotice({
  label,
  title,
  description,
  children,
  headingLevel = "h1",
  className
}: PublicStatusNoticeProps) {
  const Heading = headingLevel;

  return (
    <section
      data-public-status-notice="true"
      className={cn("mx-auto max-w-[58rem] border-y border-border/80 py-[clamp(2.75rem,7vw,5.5rem)]", className)}
    >
      <div className="grid gap-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-10">
        <p className="kicker text-accent">{label}</p>
        <div>
          <Heading className="max-w-[18ch] text-balance font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] tracking-[-0.03em] text-foreground">
            {title}
          </Heading>
          <p className="mt-5 max-w-[54ch] text-base leading-[1.75] text-foreground/75">
            {description}
          </p>
          {children ? <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default PublicStatusNotice;
