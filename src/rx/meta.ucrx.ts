import { UcrxContext } from './ucrx-context.js';
import { Ucrx } from './ucrx.js';

/**
 * Charge metadata receiver.
 *
 * @param cx - Charge processing context.
 * @param rx - Charge receiver.
 * @param attr - Metadata attribute name.
 *
 * @returns Either metadata argument receiver, or `undefined` if metadata attribute can not be recognized.
 */
export type MetaUcrx = (cx: UcrxContext, rx: Ucrx, attr: string) => Ucrx | undefined;
