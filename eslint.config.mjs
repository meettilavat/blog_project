import next from "eslint-config-next";

const config = [
  {
    ignores: ["node_modules", ".next", "apps/*/.next", "dist"]
  },
  {
    settings: {
      next: {
        rootDir: ["apps/admin", "apps/public"]
      }
    }
  },
  ...next
];

export default config;
