import { UcrxContext } from './ucrx-context.js';
import { UcrxReject } from './ucrx-rejection.js';
import { Ucrx } from './ucrx.js';

/**
 * Charge metadata receiver.
 *
 * @param context - Charge processing context.
 * @param rx - Charge receiver.
 * @param attribute - Metadata attribute name.
 * @param reject - Rejection callback.
 *
 * @returns Either metadata argument receiver, or `undefined` if metadata attribute can not be recognized.
 */
export type MetaUcrx = (
  context: UcrxContext,
  rx: Ucrx,
  attribute: string,
  reject: UcrxReject,
) => Ucrx | undefined;
