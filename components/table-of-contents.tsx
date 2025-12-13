import { HeadingItem } from "@/lib/utils";

type Props = {
  headings: HeadingItem[];
};

export function TableOfContents({ headings }: Props) {
  if (!headings.length) return null;

  const list = (
    <ul className="space-y-2 text-sm leading-snug text-foreground/70">
      {headings.map((heading) => (
        <li key={heading.id} className="pl-2" style={{ marginLeft: (heading.level - 1) * 10 }}>
          <a
            href={`#${heading.id}`}
            className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <details className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 md:hidden">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.3em] text-foreground/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          On this page
        </summary>
        <div className="mt-3">{list}</div>
      </details>
      <aside className="sticky top-24 hidden w-60 flex-shrink-0 md:block">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
          On this page
        </p>
        {list}
      </aside>
    </>
  );
}

export default TableOfContents;
