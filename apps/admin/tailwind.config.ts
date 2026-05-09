import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "tailwindcss";
import preset from "../../config/tailwind/preset.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

const config: Config = {
  content: [
    path.join(here, "app/**/*.{ts,tsx}"),
    path.join(here, "components/**/*.{ts,tsx}"),
    path.join(repoRoot, "components/**/*.{ts,tsx}"),
    path.join(repoRoot, "lib/**/*.{ts,tsx}")
  ],
  presets: [preset]
};

export default config;
