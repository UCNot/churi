import { AllUcrx } from './all.ucrx.js';
import { UctxMode } from './uctx-mode.js';

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
   * @param mode - Transfer mode.
   */
  toUC?(rx: AllUcrx, mode: UctxMode): void;

  /**
   * Represents the object as JSON.
   *
   * Called if {@link toUC} is absent. The result is encoded then with built-in algorithm.
   *
   * @returns The value to encode instead.
   */
  toJSON?(): unknown;
}
