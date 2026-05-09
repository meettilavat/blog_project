import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

const Figure = Image.extend({
  name: "image",
  group: "block",
  isolating: true,
  draggable: true,
  addAttributes() {
    const parentAddAttributes = (this as unknown as { parent: (() => Record<string, unknown>) | undefined }).parent;
    const baseAttributes =
      typeof parentAddAttributes === "function" ? parentAddAttributes() : {};
    return {
      ...baseAttributes,
      caption: {
        default: ""
      },
      layout: {
        default: "center"
      },
      align: {
        default: "right"
      }
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure",
        getAttrs: (element: HTMLElement) => {
          const image = element.querySelector("img");
          if (!image) return false;
          return {
            src: image.getAttribute("src"),
            alt: image.getAttribute("alt"),
            title: image.getAttribute("title"),
            caption: element.querySelector("figcaption")?.textContent ?? "",
            layout: element.dataset.layout ?? "center",
            align: element.dataset.align ?? "right"
          };
        }
      },
      { tag: "img[src]" }
    ];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const { caption, layout, align, ...attrs } = HTMLAttributes;
    const figureAttrs = {
      class: "tiptap-figure",
      "data-layout": layout || "center",
      "data-align": align || "right"
    };
    return [
      "figure",
      figureAttrs,
      ["img", mergeAttributes(this.options.HTMLAttributes, attrs)],
      ["figcaption", {}, caption || ""]
    ];
  }
});

export default Figure;
