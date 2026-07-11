import { describe, expect, it, vi } from "vitest";

const HTTPS_PROTOCOL = "https://";
const REMOTE_FIGURE_IMAGE_SRC = [HTTPS_PROTOCOL, "images.example.com", "/photo.png"].join("");

vi.mock("@tiptap/extension-image", () => ({
  default: {
    extend: (options: unknown) => options
  }
}));

vi.mock("@tiptap/core", () => ({
  mergeAttributes: (...attrs: Array<Record<string, unknown>>) => Object.assign({}, ...attrs)
}));

import Figure from "../extensions/figure-extension";

describe("lib/tiptap/extensions/figure-extension.ts", () => {
  it("defines the extended image node metadata", () => {
    expect(Figure.name).toBe("image");
    expect(Figure.group).toBe("block");
    expect(Figure.isolating).toBe(true);
    expect(Figure.draggable).toBe(true);
  });

  it("adds caption attribute on top of parent attributes", () => {
    const addAttributes = Figure.addAttributes as (this: { parent: () => Record<string, unknown> }) => Record<string, unknown>;
    const attrs = addAttributes.call({
      parent: () => ({
        src: { default: null },
        alt: { default: null }
      })
    });

    expect(attrs).toEqual({
      src: { default: null },
      alt: { default: null },
      caption: { default: "" },
      layout: { default: "center" },
      align: { default: "right" }
    });
  });

  it("parses figure nodes into image attributes and caption text", () => {
    const parseRules = (Figure.parseHTML as () => Array<{ tag: string; getAttrs?: (element: HTMLElement) => unknown }>)();
    const figureRule = parseRules[0];

    const image = {
      getAttribute: (name: string) =>
        ({
          src: REMOTE_FIGURE_IMAGE_SRC,
          alt: "Photo alt",
          title: "Photo title"
        })[name] ?? null
    };
    const attrs = figureRule.getAttrs?.({
      querySelector: (selector: string) => {
        if (selector === "img") return image;
        if (selector === "figcaption") return { textContent: "Figure caption" };
        return null;
      },
      dataset: {
        layout: "side",
        align: "left"
      }
    } as unknown as HTMLElement);

    expect(attrs).toEqual({
      src: REMOTE_FIGURE_IMAGE_SRC,
      alt: "Photo alt",
      title: "Photo title",
      caption: "Figure caption",
      layout: "side",
      align: "left"
    });
    expect(parseRules[1]).toEqual({ tag: "img[src]" });
  });

  it("returns false from figure parser when no image exists", () => {
    const parseRules = (Figure.parseHTML as () => Array<{ getAttrs?: (element: HTMLElement) => unknown }>)();
    const figureRule = parseRules[0];

    const attrs = figureRule.getAttrs?.({
      querySelector: () => null
    } as unknown as HTMLElement);

    expect(attrs).toBe(false);
  });

  it("renders figure markup with merged image attributes and figcaption", () => {
    const renderHTML = Figure.renderHTML as (
      this: { options: { HTMLAttributes: Record<string, unknown> } },
      args: { HTMLAttributes: Record<string, unknown> }
    ) => unknown;
    const html = renderHTML.call(
      {
        options: {
          HTMLAttributes: {
            loading: "lazy"
          }
        }
      },
      {
        HTMLAttributes: {
          src: "/cover.png",
          alt: "Cover",
          caption: "Cover caption",
          layout: "wide",
          align: "right"
        }
      }
    );

    expect(html).toEqual([
      "figure",
      { class: "tiptap-figure tiptap-figure-wide", "data-layout": "wide", "data-align": "right" },
      ["img", { loading: "lazy", src: "/cover.png", alt: "Cover" }],
      ["figcaption", {}, "Cover caption"]
    ]);
  });

  it("emits the same side-layout classes used by the public renderer", () => {
    const renderHTML = Figure.renderHTML as (
      this: { options: { HTMLAttributes: Record<string, unknown> } },
      args: { HTMLAttributes: Record<string, unknown> }
    ) => unknown;

    expect(renderHTML.call(
      { options: { HTMLAttributes: {} } },
      {
        HTMLAttributes: {
          src: "/phone.png",
          alt: "Phone map",
          layout: "side",
          align: "left"
        }
      }
    )).toEqual([
      "figure",
      {
        class: "tiptap-figure tiptap-figure-side tiptap-figure-side-left",
        "data-layout": "side",
        "data-align": "left"
      },
      ["img", { src: "/phone.png", alt: "Phone map" }],
      ["figcaption", {}, ""]
    ]);
  });
});
