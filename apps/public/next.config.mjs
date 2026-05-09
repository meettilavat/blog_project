import path from "node:path";
import { fileURLToPath } from "node:url";
import baseConfig from "../../next.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  ...baseConfig,
  turbopack: {
    ...(baseConfig.turbopack ?? {}),
    root: path.resolve(__dirname, "../..")
  }
};

export default nextConfig;
