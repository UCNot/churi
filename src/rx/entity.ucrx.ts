import { UcrxContext } from './ucrx-context.js';
import { Ucrx } from './ucrx.js';

/**
 * Named entity receiver.
 *
 * Entities has syntax like `!entity`.
 *
 * @param cx - Charge processing context.
 * @param rx - Charge receiver.
 * @param entity - Entity name to process.
 *
 * @returns Either `1` if entity processed successfully, or `0` if entity can not be recognized. The next entity
 * receiver will be used in the latter case.
 */
export type EntityUcrx = (this: void, cx: UcrxContext, rx: Ucrx, entity: string) => 0 | 1;
