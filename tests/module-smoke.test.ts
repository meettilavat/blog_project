import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  createNotFoundControlFlowError,
  createRedirectControlFlowError
} from "./navigation-control-flow";

type MockScriptProps = React.ScriptHTMLAttributes<HTMLScriptElement> & {
  children?: React.ReactNode;
};

type MockLinkProps =
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children?: React.ReactNode;
    href?: string | URL | null;
  };

function renderScriptMock({ children, ...props }: MockScriptProps) {
  return React.createElement("script", props, children);
}

function renderAnchorMock({ children, href, ...props }: MockLinkProps) {
  return React.createElement(
    "a",
    {
      ...props,
      href: typeof href === "string" ? href : String(href ?? "")
    },
    children
  );
}

vi.mock("next/font/google", () => {
  const makeFont = (options?: { variable?: string }) => ({
    variable: options?.variable ?? "--font-mock"
  });
  return {
    Space_Grotesk: makeFont,
    Literata: makeFont,
    IBM_Plex_Mono: makeFont,
    Source_Sans_3: makeFont,
    Fraunces: makeFont,
    Newsreader: makeFont
  };
});

vi.mock("next/script", () => ({
  default: renderScriptMock
}));

vi.mock("next/link", () => ({
  default: renderAnchorMock
}));

vi.mock("next/dynamic", () => ({
  default: (
    _loader: unknown,
    options?: {
      loading?: () => React.ReactNode;
    }
  ) => {
    const DynamicMock = () =>
      options?.loading
        ? React.createElement(React.Fragment, null, options.loading())
        : React.createElement("div", { "data-dynamic-mock": true });
    return DynamicMock;
  }
}));

const redirectMock = vi.fn((target: string) => {
  throw createRedirectControlFlowError(target);
});
const notFoundMock = vi.fn(() => {
  throw createNotFoundControlFlowError();
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  redirect: redirectMock,
  notFound: notFoundMock
}));

const MODULES = [
  "@/apps/admin/app/(auth)/login/page",
  "@/apps/admin/app/(public)/page",
  "@/apps/admin/app/(public)/posts/[slug]/page",
  "@/apps/admin/app/dashboard/page",
  "@/apps/admin/app/editor/[slug]/page",
  "@/apps/admin/app/editor/new/page",
  "@/apps/admin/features/editor/ui/editor-form",
  "@/apps/admin/features/editor/server/post-actions",
  "@/apps/admin/app/layout",
  "@/apps/admin/proxy",
  "@/apps/public/app/layout",
  "@/apps/public/app/page",
  "@/apps/public/app/posts/[slug]/page",
  "@/apps/public/app/robots",
  "@/apps/public/app/sitemap",
  "@/apps/public/components/public-footer",
  "@/apps/public/components/public-header",
  "@/components/auth/auth-form",
  "@/components/dashboard/filter-bar",
  "@/components/editor/commands",
  "@/components/editor/fields/cover-image-field",
  "@/components/editor/quick-insert",
  "@/components/editor/rich-editor",
  "@/apps/admin/components/shell/header",
  "@/components/posts/post-card",
  "@/components/posts/post-cover-media",
  "@/components/posts/post-meta-row",
  "@/components/content/chrome/reading-progress",
  "@/components/profile/resume-page",
  "@/components/content/rich-text/rich-text-viewer",
  "@/components/content/chrome/table-of-contents",
  "@/components/layout/theme-toggle",
  "@/apps/admin/components/shell/typography-toggle",
  "@/components/ui/badge",
  "@/components/dashboard/filter-card",
  "@/components/ui/input",
  "@/components/ui/label",
  "@/components/ui/textarea",
  "@/lib/actions/auth",
  "@/lib/actions/status",
  "@/lib/data/drafts",
  "@/lib/supabase/client",
  "@/lib/tiptap/extensions/figure-extension",
  "@/lib/posts/contracts/types",
  "@/lib/posts/contracts/post-contract",
  "@/lib/posts/repository/admin-posts-repository",
  "@/lib/posts/repository/public-posts-repository"
] as const;

describe("module smoke tests", () => {
  for (const modulePath of MODULES) {
    it(`imports ${modulePath}`, async () => {
      const imported = await import(modulePath);
      expect(imported).toBeTypeOf("object");
    });
  }
});
