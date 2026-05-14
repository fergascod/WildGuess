export function returnName(sp: any) {
  if ('preferred_common_name' in sp) {
    return `${sp['preferred_common_name']} (${sp['name']})`;
  }
  return sp['name'];
}

export type Bounds = { min: number; max: number };

// Accepted ranges for the test form, mirroring the old web `<input min/max>`.
export const QUESTION_BOUNDS: Bounds = { min: 1, max: 20 };
export const SPECIES_BOUNDS: Bounds = { min: 2, max: 100 };

/** Returns an error message if `value` is set but outside `bounds`. */
export function rangeError(
  value: number | null,
  { min, max }: Bounds,
): string | undefined {
  if (value == null) return undefined;
  if (value < min || value > max) return `Ha de ser entre ${min} i ${max}`;
  return undefined;
}
