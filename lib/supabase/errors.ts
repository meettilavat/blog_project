export function isMissingColumnError(error: unknown, table: string, column: string) {
  if (!error || typeof error !== "object") return false;

  const code = "code" in error && typeof (error as any).code === "string"
    ? (error as any).code
    : "";
  const message = "message" in error && typeof (error as any).message === "string"
    ? (error as any).message
    : "";

  if (code === "42703") return true; // Postgres undefined_column

  const normalizedMessage = message.toLowerCase();
  const tableLower = table.toLowerCase();
  const columnLower = column.toLowerCase();

  if (code === "PGRST204") {
    // PostgREST: "Could not find the 'excerpt' column of 'posts' in the schema cache"
    return normalizedMessage.includes(`'${columnLower}'`) && normalizedMessage.includes(`'${tableLower}'`);
  }

  return (
    normalizedMessage.includes(`column ${tableLower}.${columnLower} does not exist`) ||
    (normalizedMessage.includes("does not exist") && normalizedMessage.includes(columnLower)) ||
    (normalizedMessage.includes("could not find") &&
      normalizedMessage.includes("column") &&
      normalizedMessage.includes(columnLower))
  );
}

