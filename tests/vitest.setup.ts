import React from "react";
import { vi } from "vitest";

// Vitest setup entrypoint loaded through config/testing/vitest.config.ts `setupFiles`.
type NextMockProps = {
  children?: React.ReactNode;
  href?: string;
  [key: string]: unknown;
};

vi.mock("next/font/google", () => {
  const makeFont = (options?: { variable?: string }) => ({
    variable: options?.variable ?? "--font-mock"
  });
  return {
    Space_Grotesk: makeFont,
    Literata: makeFont,
    IBM_Plex_Mono: makeFont,
    Source_Sans_3: makeFont,
    Newsreader: makeFont,
    Fraunces: makeFont
  };
});

vi.mock("next/script", () => ({
  default: ({ children, ...props }: NextMockProps) =>
    React.createElement("script", props as React.HTMLAttributes<HTMLScriptElement>, children)
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: NextMockProps) =>
    React.createElement(
      "a",
      {
        ...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>),
        href: typeof href === "string" ? href : String(href ?? "")
      },
      children
    )
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

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  redirect: vi.fn((target: string) => {
    throw new Error(`redirect:${target}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("notFound");
  })
}));

export const VITEST_SETUP_LOADED = true;
