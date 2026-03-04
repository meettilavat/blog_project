type ErrorPolicy = Record<string, string>;

export function resolveErrorPolicy<TPolicy extends ErrorPolicy>(
  defaults: TPolicy,
  overrides?: Partial<TPolicy>
): TPolicy {
  return {
    ...defaults,
    ...(overrides ?? {})
  };
}
