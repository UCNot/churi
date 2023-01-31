import { asArray, valueByRecipe } from '@proc7ts/primitives';
import { URIChargeParser } from './uri-charge-parser.js';
import { URIChargeRx } from './uri-charge-rx.js';

/**
 * URI uncharger recognizes specific entities within URI charge.
 *
 * Can be passed to {@link URIChargeParser} to add support for custom entities.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 */
export interface URIUncharger<out TValue = unknown, out TCharge = unknown> {
  /**
   * Recognized entities.
   *
   * An object literal with entity as its key, and entity handler as value.
   */
  readonly entities?:
    | {
        readonly [rawEntity: string]: URIUncharger.EntityHandler<TCharge> | undefined;
      }
    | undefined;

  /**
   * Recognized entity prefixes.
   *
   * An object literal with entity prefix as its key, and matching prefix handler as value.
   */
  readonly prefixes?:
    | {
        readonly [prefix: string]: URIUncharger.PrefixHandler<TCharge> | undefined;
      }
    | undefined;
}

/**
 * Constructs URI uncharger {@link URIUncharger.Factory factory} out of its {@link URIUncharger.Spec specifier}.
 *
 * When multiple unchargers specified, the handlers specified later take precedence.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 * @param spec - Source uncharger specifier.
 *
 * @returns Uncharger factory.
 */
export function URIUncharger<TValue, TCharge>(
  spec: URIUncharger.Spec<TValue, TCharge>,
): URIUncharger.Factory<TValue, TCharge> {
  return (target: URIUncharger.Target<TValue, TCharge>): URIUncharger<TValue, TCharge> => {
    const entities: Record<string, URIUncharger.EntityHandler<TCharge>> = {};
    const prefixes: Record<string, URIUncharger.PrefixHandler<TCharge>> = {};

    for (const recipe of asArray(spec)) {
      const ext = valueByRecipe(recipe, target);

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

export namespace URIUncharger {
  /**
   * URI uncharger(s) specifier.
   *
   * Either {@link URIUncharger uncharger} instance, its {@link Factory factory}, or array of the above.
   * Can be `undefined` as well.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   */
  export type Spec<TValue = unknown, TCharge = unknown> =
    | Factory<TValue, TCharge>
    | URIUncharger<TValue, TCharge>
    | readonly (Factory<TValue, TCharge> | URIUncharger<TValue, TCharge>)[]
    | undefined;

  /**
   * URI uncharger factory.
   *
   * Creates an uncharger instance for the given target.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   * @param target - Uncharge target. This is typically a {@link URIChargeParser parser} instance.
   *
   * @returns Uncharger instance.
   */
  export type Factory<out TValue = unknown, out TCharge = unknown> = {
    extendCharge(target: Target<TValue, TCharge>): URIUncharger<TValue, TCharge>;
  }['extendCharge'];

  /**
   * URI uncharge target.
   *
   * Passed to {@link Factory uncharger factory} to create an uncharger instance.
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
