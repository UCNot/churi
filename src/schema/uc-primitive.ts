import { asis } from '@proc7ts/primitives';
import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';

/**
 * Primitive value that may be present within URI charge.
 *
 * Any JavaScript primitive, including `null`, and excluding `Symbol` and `undefined`.
 */
export type UcPrimitive = bigint | boolean | number | string | null;

export const UcBigInt: UcSchema<bigint> = {
  from: '@hatsy/churi',
  type: 'bigint',
  asis,
};

export const UcBoolean: UcSchema<boolean> = {
  from: '@hatsy/churi',
  type: 'boolean',
  asis,
};

export const UcNumber: UcSchema<number> = {
  from: '@hatsy/churi',
  type: 'number',
  asis,
};

export const UcString: UcSchema<string> = {
  from: '@hatsy/churi',
  type: 'string',
  flags: UC_DATA_ENCODED,
  asis,
};
