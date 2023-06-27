import { UcToken } from '../syntax/uc-token.js';
import { UcrxReject } from './ucrx-rejection.js';
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
   * Processes entity.
   *
   * @param rx - Charge receiver to add processed entity to.
   * @param entity - Entity to process represented as array of tokens.
   * @param reject - Rejection callback.
   *
   * @returns Either `1` if entity recognized, or `0` for unrecognized entity.
   */
  entity(rx: Ucrx, entity: readonly UcToken[], reject: UcrxReject): 0 | 1;

  /**
   * Processes metadata attribute.
   *
   * @param rx - Charge receiver to add processed metadata to.
   * @param attribute - Metadata attribute name.
   * @param reject - Rejection callback.
   *
   * @returns Either metadata argument receiver, or `undefined` if metadata attribute can not be recognized.
   */
  meta(rx: Ucrx, attribute: string, reject: UcrxReject): Ucrx | undefined;
}
