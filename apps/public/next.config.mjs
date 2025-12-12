import path from "path";
import { fileURLToPath } from "url";
import pkg from "@next/env";
import baseConfig from "../../next.config.mjs";

const { loadEnvConfig } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "../..");
loadEnvConfig(projectDir);

const nextConfig = {
  ...baseConfig
};

export default nextConfig;
