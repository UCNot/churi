import { asis } from '@proc7ts/primitives';
import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';

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
  from: '@hatsy/churi',
  type: 'bigint',
  asis,
};

/**
 * URI charge schema definition for `boolean` value.
 */
export const UcBoolean: UcSchema<boolean> = {
  from: '@hatsy/churi',
  type: 'boolean',
  asis,
};

/**
 * URI charge schema definition for `number` value.
 */
export const UcNumber: UcSchema<number> = {
  from: '@hatsy/churi',
  type: 'number',
  asis,
};

/**
 * URI charge schema definition for `string` value.
 */
export const UcString: UcSchema<string> = {
  from: '@hatsy/churi',
  type: 'string',
  flags: UC_DATA_ENCODED,
  asis,
};
