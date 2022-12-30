import { asis } from '@proc7ts/primitives';
import { CHURI_MODULE } from '../impl/module-names.js';
import { UcSchema } from './uc-schema.js';

/**
 * Primitive value that may be present within URI charge.
 *
 * Any JavaScript primitive, including `null`, and excluding `Symbol` and `undefined`.
 */
export type UcPrimitive = bigint | boolean | number | string | null;

/**
 * URI charge schema definition for `bigint` value.
 */
export const UcBigInt: UcSchema<bigint> = {
  from: CHURI_MODULE,
  type: 'bigint',
  asis,
};

/**
 * URI charge schema definition for `boolean` value.
 */
export const UcBoolean: UcSchema<boolean> = {
  from: CHURI_MODULE,
  type: 'boolean',
  asis,
};

/**
 * URI charge schema definition for `number` value.
 */
export const UcNumber: UcSchema<number> = {
  from: CHURI_MODULE,
  type: 'number',
  asis,
};

/**
 * URI charge schema definition for `string` value.
 */
export const UcString: UcSchema<string> = {
  from: CHURI_MODULE,
  type: 'string',
  asis,
};
