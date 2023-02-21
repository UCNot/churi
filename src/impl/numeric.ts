export function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}
