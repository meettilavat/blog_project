import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FEATURED_POST_SLUG } from "@/lib/posts/featured";
import { EntryLedger } from "../entry-ledger";

const base = { excerpt: null, coverImageUrl: null, status: "published" as const, updatedAt: "2026-01-01T00:00:00Z" };

describe("EntryLedger", () => {
  it("lists entries with type labels, links, and chronological entry numbers", () => {
    const html = renderToStaticMarkup(
      <EntryLedger entries={[
        { id: "1", title: "Tree Census", slug: FEATURED_POST_SLUG, createdAt: "2026-05-09T00:00:00Z", ...base },
        { id: "2", title: "Victorian LLM", slug: "victorian-llm", createdAt: "2025-12-12T00:00:00Z", ...base }
      ]} />
    );
    expect(html).toContain("Tree Census");
    expect(html).toContain("Victorian LLM");
    expect(html).toContain("Case study");
    expect(html).toContain("Field note");
    expect(html).toContain(`href="/posts/${FEATURED_POST_SLUG}"`);
    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toMatch(/Tree Census[\s\S]*?Entry 02/);
    expect(html).toMatch(/Victorian LLM[\s\S]*?Entry 01/);
  });
});
