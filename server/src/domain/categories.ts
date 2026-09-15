import type { Category } from './types.js';
import { categoriesSchema } from './types.js';

/** Parse Alert.categories JSON from Prisma into a validated Category[]. */
export function parseCategories(value: unknown): Category[] {
  return categoriesSchema.parse(value);
}
