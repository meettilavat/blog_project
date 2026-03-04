import type { Config } from "tailwindcss";
import preset from "../../config/tailwind/preset.mjs";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "../../components/**/*.{ts,tsx}",
    "../../lib/**/*.{ts,tsx}"
  ],
  presets: [preset]
};

export default config;
