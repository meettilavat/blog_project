import { normalizeHttpUrl } from "@/lib/config/http-url";

const SITE_URL_CANDIDATES = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL"
] as const;

const ALWAYS_ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "images.pexels.com",
  "lh3.googleusercontent.com",
  "localhost",
  "127.0.0.1"
];

type RuntimePolicyEnv = Record<string, string | undefined>;
type RuntimePolicyWarningCode = "SITE_URL_CONFIG" | "SUPABASE_URL_CONFIG";

type RuntimePolicyWarning = {
  code: RuntimePolicyWarningCode;
  message: string;
};

type RuntimePolicyWarningReporter = (warning: RuntimePolicyWarning) => void;

function extractHostname(url: string | null) {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isManagedSupabaseHost(hostname: string) {
  return hostname.endsWith(".supabase.co") || hostname.endsWith(".supabase.in");
}

function resolveSiteUrl(env: RuntimePolicyEnv, reportWarning?: RuntimePolicyWarningReporter) {
  for (const envVarName of SITE_URL_CANDIDATES) {
    const normalized = normalizeHttpUrl(env[envVarName], {
      allowHostOnly: true
    });
    if (normalized.value) {
      return normalized.value;
    }
    if (normalized.error) {
      reportWarning?.({
        code: "SITE_URL_CONFIG",
        message: `[site-url] Ignoring invalid ${envVarName}: ${normalized.error}`
      });
    }
  }

  return null;
}

function resolveSupabaseUrl(env: RuntimePolicyEnv, reportWarning?: RuntimePolicyWarningReporter) {
  const normalized = normalizeHttpUrl(env.NEXT_PUBLIC_SUPABASE_URL, {
    allowHostOnly: true
  });
  if (normalized.value) {
    return normalized.value;
  }

  if (normalized.error) {
    reportWarning?.({
      code: "SUPABASE_URL_CONFIG",
      message: `[image-host-policy] Ignoring invalid NEXT_PUBLIC_SUPABASE_URL: ${normalized.error}`
    });
  }
  return null;
}

export type RuntimeUrlPolicy = {
  siteUrl: string | null;
  supabaseUrl: string | null;
  allowedImageHosts: ReadonlySet<string>;
};

export function buildRuntimeUrlPolicy(
  env: RuntimePolicyEnv,
  reportWarning?: RuntimePolicyWarningReporter
): RuntimeUrlPolicy {
  const siteUrl = resolveSiteUrl(env, reportWarning);
  const supabaseUrl = resolveSupabaseUrl(env, reportWarning);

  const allowedImageHosts = new Set(ALWAYS_ALLOWED_IMAGE_HOSTS);
  const siteHost = extractHostname(siteUrl);
  if (siteHost) {
    allowedImageHosts.add(siteHost);
  }
  const supabaseHost = extractHostname(supabaseUrl);
  if (supabaseHost) {
    allowedImageHosts.add(supabaseHost);
  }

  return {
    siteUrl,
    supabaseUrl,
    allowedImageHosts
  };
}

function emitRuntimePolicyWarning(warning: RuntimePolicyWarning) {
  process.emitWarning(warning.message, {
    code: warning.code
  });
}

export function getRuntimeUrlPolicy({
  env = process.env as RuntimePolicyEnv,
  reportWarning = emitRuntimePolicyWarning
}: {
  env?: RuntimePolicyEnv;
  reportWarning?: RuntimePolicyWarningReporter;
} = {}): RuntimeUrlPolicy {
  return buildRuntimeUrlPolicy(env, reportWarning);
}
