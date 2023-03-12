import { Ucrx } from '../../rx/ucrx.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { uccInitObject, UccPropertyInit } from '../ucc-object-init.js';
import { UcdFunction } from './ucd-function.js';

/**
 * Initializer of {@link @hatsy/churi!Ucrx charge receiver}.
 */
export type UcdUcrx = UcdUcrx.Code | UcdUcrx.Init;

export namespace UcdUcrx {
  export type Code = {
    readonly init?: undefined;
    create(prefix: string, suffix: string): UccCode.Source;
    readonly properties: { readonly [key in keyof Ucrx]?: boolean | undefined };
  };

  /**
   * Per-property initializer of {@link @hatsy/churi!Ucrx charge receiver}.
   */
  export interface Init {
    readonly init?: UccCode.Source | undefined;
    readonly create?: undefined;
    readonly properties: UcdUcrxProperties;
  }

  export interface Placement {
    readonly prefix: string;
    readonly suffix: string;
  }
}

/**
 * Per-property initializers of {@link @hatsy/churi!UcrxItem charge item receiver}.
 */
export type UcdUcrxProperties = {
  readonly [key in keyof Ucrx]?: UccPropertyInit | undefined;
};

/**
 * A location inside deserializer function to insert generated code into.
 *
 * @typeParam T - Supported data type.
 */
export interface UcdUcrxLocation<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
  /**
   * Enclosing deserializer function. Not necessarily for the target value.
   */
  readonly fn: UcdFunction;

  /**
   * Schema of deserialized value.
   */
  readonly schema: TSchema;

  /**
   * An expression resolved to deserialized value setter function.
   */
  readonly setter: string;
}

export function ucdCreateUcrx(rxInit: UcdUcrx, placement: UcdUcrx.Placement): UccCode.Source;
export function ucdCreateUcrx(
  rxInit: UcdUcrx,
  { prefix, suffix }: UcdUcrx.Placement,
): UccCode.Source {
  if (rxInit.create) {
    return rxInit.create(prefix, suffix);
  }

  return code => {
    const { init, properties } = rxInit;

    if (init) {
      code.write(init);
    }

    code.write(
      uccInitObject(prefix, suffix, properties, UCRX_ITEM_PROPERTIES, uccInitPropertyToNull),
    );
  };
}

const UCRX_ITEM_PROPERTIES: (keyof Ucrx)[] = [
  'big',
  'bol',
  'nls',
  'num',
  'str',
  'for',
  'map',
  'em',
  'ls',
  'any',
  'nul',
];

function uccInitPropertyToNull(prefix: string, suffix: string): UccCode.Source {
  return `${prefix}null${suffix}`;
}
