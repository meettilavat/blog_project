import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostCoverMedia } from "@/components/posts/post-cover-media";

const UNTRUSTED_COVER_SRC = ["https://", "untrusted.example.com", "/cover.png"].join("");

describe("components/posts/post-cover-media.tsx", () => {
  it("renders fallback label when source is missing", () => {
    const html = renderToStaticMarkup(<PostCoverMedia src={null} alt="Cover" />);

    expect(html).toContain("No cover image");
    expect(html).toContain("data-cover-placeholder=\"true\"");
    expect(html).not.toContain("radial-gradient");
  });

  it("renders native img for non-whitelisted hosts", () => {
    const html = renderToStaticMarkup(
      <PostCoverMedia src={UNTRUSTED_COVER_SRC} alt="Cover" width={320} height={180} />
    );

    expect(html).toContain("<img");
    expect(html).toContain("untrusted.example.com/cover.png");
  });

  it("supports intrinsic-fit media without changing host policy", () => {
    const html = renderToStaticMarkup(
      <PostCoverMedia src="/cover.png" alt="Dashboard overview" width={640} height={360} fit="contain" />
    );

    expect(html).toContain("object-contain");
    expect(html).toContain("Dashboard overview");
  });
});
