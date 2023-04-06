import { TokenUcrx } from '../rx/token.ucrx.js';

/**
 * Charges URI string with the given value.
 *
 * Handles primitive values, {@link Uctx custom charge transfers}, as well as arbitrary arrays and object literals.
 *
 * @param value - The value to encode.
 *
 * @returns Either encoded value, or `undefined` if the value can not be encoded.
 */
export function chargeURI(value: unknown): string | undefined {
  return TokenUcrx.print(value);
}
