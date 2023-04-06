import { Ucrx } from './ucrx.js';

/**
 * Charge transfer interface.
 *
 * Customizes the object charge.
 */
export interface Uctx {
  /**
   * Represents the object as charge and transfers it to the given charge receiver.
   *
   * It is expected that the receiver accepts charges of any type, so it is not necessary to check the results
   * of receiver's method calls.
   *
   * @param rx - Charge receiver.
   */
  toUc?(rx: Ucrx): void;

  /**
   * Represents the object as JSON.
   *
   * Called if {@link toUc} is absent. The result is encoded then with built-in algorithm.
   *
   * @returns The value to encode instead.
   */
  toJSON?(): unknown;
}
