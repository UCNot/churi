import { UcMeta } from '../schema/meta/uc-meta.js';
import { UcRejection } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';
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
   * Metadata for currently charged value.
   */
  readonly meta: UcMeta.Mutable;

  /**
   * Rejects the charge.
   *
   * @param rejection - Rejection reason.
   *
   * @returns Always `0` to be able to return it from receiver's method.
   */
  reject(rejection: UcRejection): 0;

  /**
   * Processes entity.
   *
   * @param entity - Entity to process represented as array of tokens.
   *
   * @returns Either `1` if entity recognized, or `0` for unrecognized entity.
   */
  onEntity(entity: string): 0 | 1;

  /**
   * Processes formatted data.
   *
   * @param format - Name of format to process.
   * @param data - Formatted data tokens.
   *
   * @returns Either `1` if format and its data recognized, or `0` otherwise.
   */
  onFormat(format: string, data: readonly UcToken[]): 0 | 1;

  /**
   * Processes metadata attribute.
   *
   * @param attribute - Metadata attribute name.
   *
   * @returns Either metadata argument receiver, or `undefined` if metadata attribute can not be recognized.
   */
  onMeta(attribute: string): Ucrx | undefined;
}
