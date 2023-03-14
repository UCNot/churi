import { jsPropertyKey } from '../impl/quote-property-key.js';
import { UccCode } from './ucc-code.js';

/**
 * Generates code for initialization of particular property within object literal expression.
 *
 * Generated initializer expected be placed between the given `prefix` and `suffix`.
 *
 * @param prefix - Generated code prefix.
 * @param suffix - Generated code suffix.
 * @param ket - Generated property key.
 *
 * @returns Initializer code source.
 */
export type UccPropertyInit = (
  prefix: UccPropertyInit.Prefix,
  suffix: string,
  key: PropertyKey,
) => UccCode.Source;

export namespace UccPropertyInit {
  export interface Prefix {
    asMethod(...args: string[]): string;
    toString(this: void): string;
  }
}

export type UccObjectInit<TKey extends keyof any = keyof any> = {
  readonly [key in TKey]?: UccPropertyInit | null | undefined;
};

export function uccInitObject<T extends UccObjectInit, TKey extends keyof T = keyof T>(
  prefix: string,
  suffix: string,
  initObject: T,
  keys: readonly TKey[],
  defaultInit?: UccPropertyInit,
): UccCode.Source {
  return code => {
    code
      .write(`${prefix}{`)
      .indent(uccInitProperties(initObject, keys, defaultInit))
      .write(`}${suffix}`);
  };
}

export function uccInitProperties<T extends UccObjectInit, TKey extends keyof T = keyof T>(
  initObject: T,
  keys: readonly TKey[],
  defaultInit?: UccPropertyInit,
): UccCode.Source {
  return code => {
    for (const key of keys) {
      const k = jsPropertyKey(key as string);
      const initProperty = initObject[key] ?? defaultInit;

      if (initProperty) {
        code.write(
          uccInitProperty(
            initProperty,
            { asMethod: (...args) => `${k}(${args.join(', ')}) `, toString: () => `${k}: ` },
            `,`,
            key,
          ),
        );
      }
    }
  };
}

export function uccInitProperty(
  propertyInit: UccPropertyInit,
  prefix: string | UccPropertyInit.Prefix,
  suffix: string,
  key: PropertyKey,
): UccCode.Source {
  return propertyInit(
    typeof prefix === 'string'
      ? { toString: () => prefix, asMethod: (...args) => `${prefix}(${args.join(', ')}) => ` }
      : prefix,
    suffix,
    key,
  );
}
