import baseConfig from "../../tailwind.config";

const config = {
  ...baseConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "../../app/**/*.{ts,tsx}",
    "../../components/**/*.{ts,tsx}",
    "../../lib/**/*.{ts,tsx}"
  ]
};

export default config;
