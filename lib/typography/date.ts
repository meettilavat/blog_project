export function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(date);
}

export function isSignificantlyUpdated(createdAt?: string | null, updatedAt?: string | null) {
  if (!createdAt || !updatedAt) return false;
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  const difference = updated - created;
  const oneDay = 1000 * 60 * 60 * 24;
  return difference > oneDay;
}
