import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";
import { describe, expect, it } from "vitest";

// The configs are .mjs with no declarations, and `allowJs` is false, so a static
// import trips TS7016. The root next.config.test.ts only gets away with one because
// it sits outside apps/public/tsconfig.json's include and is never typechecked.
// A non-literal specifier keeps resolution out of it and lets the annotation stand.
const loadConfig = async (specifier: string): Promise<NextConfig> => {
  const loaded: { default: NextConfig } = await import(specifier);
  return loaded.default;
};

const publicConfig = await loadConfig("./next.config.mjs");
const baseConfig = await loadConfig("../../next.config.mjs");

describe("apps/public/next.config.mjs", () => {
  it("inlines the stylesheet so nothing blocks render", () => {
    // Measured on the live site: the document finished at 166ms and the single
    // render-blocking CSS request at 239ms, with no other blocking resource. That
    // chain is the entire critical path, and Lighthouse scored it 0 until inlined.
    expect(publicConfig.experimental?.inlineCss).toBe(true);
  });

  it("keeps inlining out of the admin app", () => {
    // Admin carries the editor CSS, which is far larger and reused across a session,
    // so inlining there would swap one cached file for bytes repeated per response.
    expect(baseConfig.experimental?.inlineCss).toBeUndefined();
  });

  it("still inherits the shared security and image configuration", () => {
    // The spread is easy to break while adding keys; these come only from the base.
    expect(publicConfig.poweredByHeader).toBe(false);
    expect(publicConfig.headers).toBe(baseConfig.headers);
    expect(publicConfig.images).toBe(baseConfig.images);
  });

  it("points turbopack at the repo root, not the app directory", () => {
    expect(publicConfig.turbopack?.root).toMatch(/blog_project$/);
  });
});

// What this field does NOT do, measured rather than assumed: it does not remove the
// `Array.prototype.at/flat/flatMap`, `Object.fromEntries/hasOwn` and
// `String.prototype.trimEnd` polyfills Lighthouse flags in the main chunk. Building
// with and without it produced a byte-identical `0iec5q4ack_04.js` (md5
// 9a9f9a93c780249341b73cf31755b2db both ways). Those come from Next's own prebuilt
// `next/dist/build/polyfills/polyfill-module.js`, which Turbopack emits
// unconditionally — 1,380 bytes on disk, not the 14 KB Lighthouse attributes to it.
// The field earns its place on the CSS side instead, and by stating a floor at all.
describe("build targets", () => {
  const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
    browserslist?: string[];
  };

  it("declares a floor rather than leaving the target implicit", () => {
    expect(pkg.browserslist).toBeDefined();
    expect(pkg.browserslist?.length).toBeGreaterThan(0);
  });

  it("sets the floor no lower than the CSS already requires", () => {
    // styles/tiptap.css uses color-mix(), which needs Chrome 111 and Safari 16.2, so
    // this is not a new restriction — it states the one the stylesheets already
    // imposed. Autoprefixer reads it and drops prefixes dead at that floor
    // (-moz-placeholder, -moz-column-gap, -o-object-fit): 361 bytes of raw CSS.
    const floors = Object.fromEntries(
      (pkg.browserslist ?? []).map((entry) => {
        const [browser, , version] = entry.split(" ");
        return [browser, Number.parseFloat(version)];
      })
    );
    expect(floors.chrome).toBeGreaterThanOrEqual(111);
    expect(floors.safari).toBeGreaterThanOrEqual(16.4);
    expect(floors.edge).toBeGreaterThanOrEqual(111);
    expect(floors.firefox).toBeGreaterThanOrEqual(92);
  });
});
