// Utility to remove undefined values recursively from objects/arrays
// Keeps nulls and special Firestore FieldValue objects as-is.
export function sanitizeForFirestore<T>(input: T): T {
  if (input === undefined) return undefined as unknown as T;
  if (input === null) return input;

  const isDate = input instanceof Date;
  if (isDate) return input;

  const type = typeof input;
  if (type !== 'object') return input;

  if (Array.isArray(input)) {
    // Sanitize each element
    return input.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  // For plain objects, drop undefined values and sanitize nested structures
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    if (value === undefined) continue;
    const sanitized = sanitizeForFirestore(value);
    // Skip keys that sanitized to undefined
    if (sanitized === undefined) continue;
    result[key] = sanitized;
  }
  return result as T;
}

