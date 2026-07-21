import { describe, expect, it, vi } from "vitest";

vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(public element: unknown, public options: unknown) {}
  }
}));
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(async () => new ArrayBuffer(8))
}));

import OpenGraphImage, { alt, size } from "./opengraph-image";

function collectStrings(node: unknown, acc: string[] = []): string[] {
  if (typeof node === "string") acc.push(node);
  if (Array.isArray(node)) node.forEach((n) => collectStrings(n, acc));
  if (node && typeof node === "object") {
    const props = (node as { props?: { children?: unknown } }).props;
    if (props?.children) collectStrings(props.children, acc);
  }
  return acc;
}

describe("opengraph-image", () => {
  it("keeps the social size and alt", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(typeof alt).toBe("string");
  });

  it("contains no journal copy and uses the amber accent", async () => {
    const res = await OpenGraphImage();
    const strings = collectStrings((res as unknown as { element: unknown }).element).join(" ");
    expect(strings).not.toMatch(/field journal/i);
    expect(strings).not.toMatch(/issue 01/i);
    expect(strings).toContain("meettilavat.com");
  });
});
