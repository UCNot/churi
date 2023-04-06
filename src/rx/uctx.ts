import { UcrxContext } from '@hatsy/churi';
import { Ucrx } from './ucrx.js';

/**
 * Charge transfer interface.
 *
 * Customizes charge encoding for the object implementing this interface.
 */
export interface Uctx {
  /**
   * Encodes the charge with to the given charge receiver.
   *
   * @param rx - Charge receiver.
   *
   * @returns Nothing or truthy value if charge succeed, or falsy value if charge failed.
   */
  toUc?(rx: Ucrx, context: UcrxContext): void | boolean | 0 | 1;

  /**
   * Represents the value as JSON.
   *
   * This method is called if {@link toUc} is absent. The result is encoded then with built-in algorithm.
   *
   * @returns The value to encode instead.
   */
  toJSON?(): unknown;
}
