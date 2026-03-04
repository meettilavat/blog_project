export function buildAbsoluteUrl(path: string, origin: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${origin}/`).toString().replace(/\/$/, "");
}
