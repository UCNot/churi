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
 * Creates URI charge schema for `bigint` value.
 */
export function UcBigInt(): UcBigInt.Schema {
  return {
    from: CHURI_MODULE,
    type: 'bigint',
    asis,
  };
}

export namespace UcBigInt {
  /**
   * URI charge schema definition for `bigint` value.
   */
  export interface Schema extends UcSchema<bigint> {
    readonly from: '@hatsy/churi';
    readonly type: 'bigint';
  }
}

/**
 * Creates URI charge schema for `boolean` value.
 */
export function UcBoolean(): UcBoolean.Schema {
  return {
    from: CHURI_MODULE,
    type: 'boolean',
    asis,
  };
}

export namespace UcBoolean {
  /**
   * URI charge schema definition for `boolean` value.
   */
  export interface Schema extends UcSchema<boolean> {
    readonly from: '@hatsy/churi';
    readonly type: 'boolean';
  }
}

/**
 * Creates URI charge schema for `number` value.
 */
export function UcNumber(): UcNumber.Schema {
  return {
    from: CHURI_MODULE,
    type: 'number',
    asis,
  };
}

export namespace UcNumber {
  /**
   * URI charge schema definition for `number` value.
   */
  export interface Schema extends UcSchema<number> {
    readonly from: '@hatsy/churi';
    readonly type: 'number';
  }
}

/**
 * Creates URI charge schema for `string` value.
 */
export function UcString(): UcString.Schema {
  return {
    from: CHURI_MODULE,
    type: 'string',
    asis,
  };
}

export namespace UcString {
  /**
   * URI charge schema definition for `string` value.
   */
  export interface Schema extends UcSchema<string> {
    readonly from: '@hatsy/churi';
    readonly type: 'string';
  }
}
