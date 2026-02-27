export function validateSQL(sql) {

  const normalizedSQL = sql.trim().toLowerCase();

  // Must start with SELECT or WITH (for analytics queries)
  if (!normalizedSQL.startsWith("select") && !normalizedSQL.startsWith("with")) {
    throw new Error("Only SELECT queries allowed");
  }

  // Block only write operations
  const forbidden = /\b(insert|update|delete)\b/i;

  if (forbidden.test(normalizedSQL)) {
    throw new Error("Write operations are not allowed");
  }

  return true;
}