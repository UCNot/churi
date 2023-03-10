import { Ucrx, UcrxItem } from '../../rx/ucrx.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcdFunction } from './ucd-function.js';

/**
 * Initializer of {@link @hatsy/churi!Ucrx charge receiver}.
 */
export type UcdUcrx = UcdUcrx.Code | UcdUcrx.Init;

export namespace UcdUcrx {
  export type Code = (prefix: string, suffix: string) => UccCode.Source;

  /**
   * Per-property initializer of {@link @hatsy/churi!Ucrx charge receiver}.
   */
  export type Init = {
    readonly init?: UccCode.Source | undefined;
    readonly item: UcdUcrxItem;
  } & {
    readonly [key in Exclude<keyof Ucrx, '_'>]?: UcdUcrxProperty | undefined;
  };

  export interface Placement {
    readonly prefix: string;
    readonly suffix: string;
  }
}

/**
 * Per-property initializers of {@link @hatsy/churi!UcrxItem charge item receiver}.
 */
export type UcdUcrxItem = { readonly [key in keyof UcrxItem]?: UcdUcrxProperty | undefined };

/**
 * Generates code for initialization of particular {@link @hatsy/churi!Ucrx charge receiver} property.
 *
 * Generated initializer expected be placed between the given `prefix` and `suffix`.
 *
 * @param prefix - Generated code prefix.
 * @param suffix - Generated code suffix.
 *
 * @returns Deserializer code source, or `undefined` if the value deserializer can not be generated.
 */
export type UcdUcrxProperty = (prefix: string, suffix: string) => UccCode.Source;

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

export function ucdInitUcrx(rxInit: UcdUcrx, placement: UcdUcrx.Placement): UccCode.Source;
export function ucdInitUcrx(
  rxInit: UcdUcrx,
  { prefix, suffix }: UcdUcrx.Placement,
): UccCode.Source {
  if (typeof rxInit === 'function') {
    return rxInit(prefix, suffix);
  }

  return code => {
    const { init } = rxInit;

    if (init) {
      code.write(init);
    }

    code
      .write(`${prefix}{`)
      .indent(code => {
        code
          .write('_: {')
          .indent(ucdInitProperties(UCRX_ITEM_PROPERTIES, rxInit.item))
          .write('},')
          .write(ucdInitProperties<Omit<UcdUcrx.Init, 'init' | 'item'>>(UCRX_PROPERTIES, rxInit));
      })
      .write(`}${suffix}`);
  };
}

function ucdInitProperties<
  T extends Record<string, UcdUcrxProperty>,
  TKey extends keyof T = keyof T,
>(keys: TKey[], rxInit: T): UccCode.Source {
  return code => {
    for (const key of keys) {
      const init = rxInit[key];

      if (init) {
        code.write(init(`${key as string}: `, `,`));
      } else {
        // Initialize to null to prevent de-optimizations.
        code.write(`${key as string}: null,`);
      }
    }
  };
}

const UCRX_PROPERTIES: Exclude<keyof Ucrx, '_'>[] = ['em', 'ls'];
const UCRX_ITEM_PROPERTIES: (keyof UcrxItem)[] = [
  'big',
  'bol',
  'nls',
  'num',
  'str',
  'for',
  'map',
  'any',
  'nul',
];
