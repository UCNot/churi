import { UcErrorInfo } from '../schema/uc-error.js';
import { Ucrx } from './ucrx.js';

/**
 * Charge processing context.
 */
export interface UcrxContext {
  /**
   * Opaque charge receiver that ignores charge.
   *
   * Used e.g. for unexpected charge after error reported.
   */
  readonly opaqueRx: Ucrx;

  /**
   * Reports charge error.
   *
   * Implementation may throw an {@link churi!UcError error} or just record the `error` info.
   *
   * @param error - Error info to report.
   */
  error(error: UcErrorInfo): void;
}
