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
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/server",
              message:
                "Import request/public client modules directly to preserve Supabase auth/public boundary seams."
            },
            {
              name: "@/lib/data/posts",
              message:
                "Import post repositories directly from '@/lib/posts/repository/*' to avoid mixing public and admin data boundaries."
            }
          ]
        }
      ]
    }
  },
  ...next
];

export default config;
