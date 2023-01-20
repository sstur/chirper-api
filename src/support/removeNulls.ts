type ReplaceNull<T> = null extends T ? Exclude<T, null> | undefined : T;

/**
 * Loop an object (shallow) replacing null values with undefined.
 */
export function removeNulls<T extends Record<string, any>>(input: T) {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key as keyof T] = value ?? undefined;
  }
  return result as { [K in keyof T]: ReplaceNull<T[K]> };
}

/**
 * Loop an object (shallow) replacing null values with undefined, except if in given allow-list.
 */
export function removeNullsExcept<
  T extends Record<string, any>,
  U extends keyof T,
>(input: T, allowNulls: Record<U, true>) {
  const exceptions: Record<string, unknown> = allowNulls;
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (exceptions[key] === true) {
      result[key as keyof T] = value;
    } else {
      result[key as keyof T] = value ?? undefined;
    }
  }
  return result as {
    [K in keyof T]: K extends U ? T[K] : ReplaceNull<T[K]>;
  };
}
