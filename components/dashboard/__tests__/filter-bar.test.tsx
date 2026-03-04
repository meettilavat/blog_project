import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FilteredDashboardList } from "../filter-bar";

const HTTPS_PROTOCOL = "https://";
const ALLOWED_COVER_URL = [HTTPS_PROTOCOL, "allowed.example", "/cover.jpg"].join("");
const BLOCKED_COVER_URL = [HTTPS_PROTOCOL, "blocked.example", "/cover.jpg"].join("");

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img data-next-image src={src} alt={alt} />
  )
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type,
    className
  }: {
    children: React.ReactNode;
    type?: "button" | "submit";
    className?: string;
  }) => (
    <button type={type} className={className}>
      {children}
    </button>
  )
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />
}));

vi.mock("@/components/dashboard/filter-card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@/apps/admin/features/editor/server/post-actions", () => ({
  deletePostAction: vi.fn()
}));

vi.mock("@/lib/actions/status", () => ({
  updateStatusAction: vi.fn()
}));

vi.mock("@/lib/typography/date", () => ({
  formatDate: (value: string) => `formatted:${value}`
}));

vi.mock("@/lib/content/image-host-policy", () => ({
  isAllowedImageHost: (url: string) => url.includes("allowed.example")
}));

describe("components/dashboard/filter-bar.tsx", () => {
  it("renders an empty-state message when there are no posts", () => {
    const html = renderToStaticMarkup(<FilteredDashboardList posts={[]} />);

    expect(html).toContain("No posts in this filter.");
    expect(html).toContain("Search by title");
  });

  it("renders post entries with cover/media and action labels", () => {
    const html = renderToStaticMarkup(
      <FilteredDashboardList
        posts={[
          {
            id: "post-1",
            title: "Published post",
            slug: "published-post",
            excerpt: null,
            coverImageUrl: ALLOWED_COVER_URL,
            status: "published",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-02T00:00:00.000Z"
          },
          {
            id: "post-2",
            title: "Draft with blocked cover",
            slug: "draft-post",
            excerpt: null,
            coverImageUrl: BLOCKED_COVER_URL,
            status: "draft",
            createdAt: "2024-01-03T00:00:00.000Z",
            updatedAt: "2024-01-04T00:00:00.000Z"
          },
          {
            id: "post-3",
            title: "Draft without cover",
            slug: "no-cover-post",
            excerpt: null,
            coverImageUrl: null,
            status: "draft",
            createdAt: "2024-01-05T00:00:00.000Z",
            updatedAt: "2024-01-06T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(html).toContain("Published post");
    expect(html).toContain("Draft with blocked cover");
    expect(html).toContain("Draft without cover");
    expect(html).toContain("slug: published-post");
    expect(html).toContain("formatted:2024-01-02T00:00:00.000Z");
    expect(html).toContain("data-next-image");
    expect(html).toContain(`src="${BLOCKED_COVER_URL}"`);
    expect(html).toContain("No cover");
    expect(html).toContain("Mark draft");
    expect(html).toContain(">Publish<");
    expect(html).toContain(">Delete<");
    expect(html).toContain("href=\"/editor/published-post\"");
  });
});
