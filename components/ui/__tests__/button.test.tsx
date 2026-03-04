import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "@/components/ui/button";

describe("components/ui/button", () => {
  it("returns variant classes", () => {
    const classes = buttonVariants({ variant: "outline", size: "sm" });
    expect(classes).toContain("border");
    expect(classes).toContain("h-9");
  });

  it("renders children by default", () => {
    const html = renderToStaticMarkup(<Button>Save</Button>);
    expect(html).toContain("Save");
    expect(html).toContain("group");
    expect(html).toContain("relative overflow-hidden");
  });

  it("keeps caller-provided classes in composed output", () => {
    const html = renderToStaticMarkup(<Button className="data-contract">Save</Button>);
    expect(html).toContain("data-contract");
  });

  it("renders loading state", () => {
    const html = renderToStaticMarkup(<Button isLoading>Save</Button>);
    expect(html).toContain("animate-pulse");
    expect(html).toContain("···");
    expect(html).not.toContain(">Save<");
    expect(html).toContain("disabled");
    expect(html).toContain("aria-busy=\"true\"");
  });

  it("keeps explicit disabled semantics when not loading", () => {
    const html = renderToStaticMarkup(<Button disabled>Save</Button>);
    expect(html).toContain("disabled");
    expect(html).not.toContain("aria-busy=\"true\"");
  });
});
