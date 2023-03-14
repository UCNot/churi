import { UcErrorInfo } from '../schema/uc-error.js';

/**
 * Charge processing context.
 */
export interface UcrxContext {
  /**
   * Reports charge error.
   *
   * Implementation may throw an {@link UcError error} or just record the `error` info.
   *
   * @param error - Error info to report.
   */
  error(error: UcErrorInfo): void;
}
