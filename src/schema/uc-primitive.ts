import { UcBoolean } from './boolean/uc-boolean.js';
import { UcBigInt } from './numeric/uc-bigint.js';
import { UcNumber } from './numeric/uc-number.js';
import { UcString } from './string/uc-string.js';

/**
 * Primitive value that may be present within URI charge.
 *
 * Any JavaScript primitive, including `null`, and excluding `Symbol` and `undefined`.
 */
export type UcPrimitive = UcBigInt | UcBoolean | UcNumber | UcString | null;
