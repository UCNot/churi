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
   * Charge rejection callback.
   *
   *  @param rejection - Rejection reason.
   *
   * @returns Always `0` to be able to return it from receiver's method.
   */
  readonly reject: UcrxReject;

  /**
   * Processes entity.
   *
   * @param entity - Entity to process represented as array of tokens.
   *
   * @returns Either `1` if entity recognized, or `0` for unrecognized entity.
   */
  onEntity(entity: readonly UcToken[]): 0 | 1;

  /**
   * Processes metadata attribute.
   *
   * @param attribute - Metadata attribute name.
   *
   * @returns Either metadata argument receiver, or `undefined` if metadata attribute can not be recognized.
   */
  onMeta(attribute: string): Ucrx | undefined;
}
