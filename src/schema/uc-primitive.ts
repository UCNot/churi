import { asis } from '@proc7ts/primitives';
import { UcSchema } from './uc-schema.js';

/**
 * Primitive value that may be present within URI charge.
 *
 * Any JavaScript primitive, including `null`, and excluding `Symbol` and `undefined`.
 */
export type UcPrimitive = bigint | boolean | number | string | null;

const UcBigInt$Schema: UcBigInt.Schema = /*#__PURE__*/ Object.freeze({
  type: 'bigint',
  asis,
});

/**
 * Creates URI charge schema for `bigint` value.
 */
export function UcBigInt(): UcBigInt.Schema {
  return UcBigInt$Schema;
}

export namespace UcBigInt {
  /**
   * URI charge schema definition for `bigint` value.
   */
  export interface Schema extends UcSchema<bigint> {
    readonly type: 'bigint';
  }
}

const UcBoolean$Schema: UcBoolean.Schema = /*#__PURE__*/ Object.freeze({
  type: 'boolean',
  asis,
});

/**
 * Creates URI charge schema for `boolean` value.
 */
export function UcBoolean(): UcBoolean.Schema {
  return UcBoolean$Schema;
}

export namespace UcBoolean {
  /**
   * URI charge schema definition for `boolean` value.
   */
  export interface Schema extends UcSchema<boolean> {
    readonly type: 'boolean';
  }
}

const UcNumber$Schema: UcNumber.Schema = /*#__PURE__*/ Object.freeze({
  type: 'number',
  asis,
});

/**
 * Creates URI charge schema for `number` value.
 */
export function UcNumber(): UcNumber.Schema {
  return UcNumber$Schema;
}

export namespace UcNumber {
  /**
   * URI charge schema definition for `number` value.
   */
  export interface Schema extends UcSchema<number> {
    readonly type: 'number';
  }
}

const UcString$Schema: UcString.Schema = /*#__PURE__*/ Object.freeze({
  type: 'string',
  asis,
});

/**
 * Creates URI charge schema for `string` value.
 */
export function UcString(): UcString.Schema {
  return UcString$Schema;
}

export namespace UcString {
  /**
   * URI charge schema definition for `string` value.
   */
  export interface Schema extends UcSchema<string> {
    readonly type: 'string';
  }
}
