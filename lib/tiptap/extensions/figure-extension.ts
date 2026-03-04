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
            caption: element.querySelector("figcaption")?.textContent ?? ""
          };
        }
      },
      { tag: "img[src]" }
    ];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const { caption, ...attrs } = HTMLAttributes;
    return [
      "figure",
      {
        class: "tiptap-figure"
      },
      ["img", mergeAttributes(this.options.HTMLAttributes, attrs)],
      ["figcaption", {}, caption || ""]
    ];
  }
});

export default Figure;
