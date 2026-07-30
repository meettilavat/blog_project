import path from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../next.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  ...baseConfig,
  experimental: {
    ...(baseConfig.experimental ?? {}),
    // The stylesheet is the whole critical chain here: document at 166ms, then the
    // CSS request finishing at 239ms, and nothing else blocks render. Inlining it
    // removes that round trip — Lighthouse measured ~130-150ms off both FCP and LCP.
    // Public-only on purpose: the admin app carries the much larger editor CSS, and
    // inlining that into every response would trade a cached file for repeated bytes.
    inlineCss: true
  },
  turbopack: {
    ...(baseConfig.turbopack ?? {}),
    root: path.resolve(__dirname, "../..")
  }
};

export default nextConfig;
