import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public accent tokens (blueprint ink)", () => {
  const css = readFileSync(resolve(process.cwd(), "styles/globals.css"), "utf8");
  const publicLight = css.slice(css.indexOf('html[data-app="public"] {'), css.indexOf('html[data-app="public"].dark'));
  const publicDark = css.slice(css.indexOf('html[data-app="public"].dark'), css.indexOf('html[data-app="admin"]'));

  it("uses blueprint ink for the light accent", () => {
    expect(publicLight).toContain("--accent: #274a73;");
    expect(publicLight).toContain("--accent-rgb: 39 74 115;");
    expect(publicLight).not.toContain("#a54d2f");
  });

  it("uses blueprint ink for the dark accent", () => {
    expect(publicDark).toContain("--accent: #8fb0ce;");
    expect(publicDark).toContain("--accent-rgb: 143 176 206;");
    expect(publicDark).not.toContain("#e59a72");
  });
});
