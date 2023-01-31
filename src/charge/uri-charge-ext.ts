import { asArray, valueByRecipe } from '@proc7ts/primitives';
import { URIChargeParser } from './uri-charge-parser.js';
import { URIChargeRx } from './uri-charge-rx.js';

/**
 * URI charge extension.
 *
 * Can be passed to {@link URIChargeParser} to add support for custom entities.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 */
export interface URIChargeExt<out TValue = unknown, out TCharge = unknown> {
  /**
   * Supported entities.
   *
   * An object literal with entity as its key, and entity handler as value.
   */
  readonly entities?:
    | {
        readonly [rawEntity: string]: URIChargeExt.EntityHandler<TCharge> | undefined;
      }
    | undefined;

  /**
   * Supported entity prefixes.
   *
   * An object literal with entity prefix as its key, and matching prefix handler as value.
   */
  readonly prefixes?:
    | {
        readonly [prefix: string]: URIChargeExt.PrefixHandler<TCharge> | undefined;
      }
    | undefined;
}

/**
 * Constructs URI charge extension {@link URIChargeExt.Factory factory} out of its {@link URIChargeExt.Spec specifier}.
 *
 * When multiple extensions specified, the handlers specified later take precedence.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 * @param spec - Source extension specifier.
 *
 * @returns Extension factory.
 */
export function URIChargeExt<TValue, TCharge>(
  spec: URIChargeExt.Spec<TValue, TCharge>,
): URIChargeExt.Factory<TValue, TCharge> {
  return (target: URIChargeExt.Target<TValue, TCharge>): URIChargeExt<TValue, TCharge> => {
    const entities: Record<string, URIChargeExt.EntityHandler<TCharge>> = {};
    const prefixes: Record<string, URIChargeExt.PrefixHandler<TCharge>> = {};

    for (const factory of asArray(spec)) {
      const ext = valueByRecipe(factory, target);

      Object.assign(entities, ext.entities);

      if (ext.prefixes) {
        for (const prefix of Object.keys(ext.prefixes)) {
          const handler = ext.prefixes[prefix];

          if (handler) {
            const prevHandler = prefixes[prefix];

            if (prevHandler) {
              prefixes[prefix] = (suffix, prefix) => {
                const entity = handler(suffix, prefix);

                return entity !== undefined ? entity : prevHandler(suffix, prefix);
              };
            } else {
              prefixes[prefix] = handler;
            }
          }
        }
      }
    }

    return {
      entities,
      prefixes,
    };
  };
}

export namespace URIChargeExt {
  /**
   * URI charge extension specifier.
   *
   * Either {@link URIChargeExt extension}, its {@link Factory factory}, array of the above, or nothing.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   */
  export type Spec<TValue = unknown, TCharge = unknown> =
    | Factory<TValue, TCharge>
    | URIChargeExt<TValue, TCharge>
    | readonly (Factory<TValue, TCharge> | URIChargeExt<TValue, TCharge>)[]
    | undefined;

  /**
   * URI charge extension factory.
   *
   * Creates an extension for the given charge receiver.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   * @param target - Extension target. This is typically a {@link URIChargeParser parser} instance.
   *
   * @returns Extension instance.
   */
  export type Factory<out TValue = unknown, out TCharge = unknown> = {
    extendCharge(target: Target<TValue, TCharge>): URIChargeExt<TValue, TCharge>;
  }['extendCharge'];

  /**
   * URI charge extension target.
   *
   * Passed to {@link Factory extension factory} when creating extension.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   */
  export interface Target<out TValue = unknown, out TCharge = unknown> {
    /**
     * Target URI charge receiver.
     */
    readonly chargeRx: URIChargeRx<TValue, TCharge>;

    /**
     * Parses URI charge from the given input.
     *
     * @param input - Input string containing encoded URI charge.
     * @param rx - Optional URI charge value receiver. New one will be {@link URIChargeRx.rxValue created} if omitted.
     *
     * @returns Parse result containing charge representation.
     */
    parse(
      input: string,
      rx?: URIChargeRx.ValueRx<TValue, TCharge>,
    ): URIChargeParser.Result<TCharge>;
  }

  /**
   * Custom entity handler.
   *
   * Creates entity charge out of raw string.
   *
   * @typeParam TCharge - URI charge representation type.
   * @param rawEntity - The entity as is, with leading `!`. _Not_ URI-decoded.
   *
   * @returns URI charge representing entity.
   */
  export type EntityHandler<out TCharge = unknown> = {
    createEntity(rawEntity: string): TCharge;
  }['createEntity'];

  /**
   * Custom entity prefix handler.
   *
   * Creates entity charge out of raw string. If entity is not recognized, then `undefined` may be returned. In this
   * case the next handler will be tried.
   *
   * @typeParam TCharge - URI charge representation type.
   * @param suffix - Entity suffix following the matching `prefix` as is. _Not_ URI-decoded.
   * @param prefix - Matching entity prefix as is. _Not_ URI-decoded.
   *
   * @returns URI charge representing entity, or `undefined` if entity is not recognized.
   */
  export type PrefixHandler<out TCharge = unknown> = {
    createEntity(suffix: string, prefix: string): TCharge | undefined;
  }['createEntity'];
}
