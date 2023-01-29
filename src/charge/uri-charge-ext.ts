import { asArray } from '@proc7ts/primitives';
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
        readonly [rawEntity: string]: URIChargeExt.EntityHandler<TCharge>;
      }
    | undefined;
}

/**
 * Constructs URI charge extension {@link URIChargeExt.Factory factory} out of its {@link URIChargeExt.Spec specifier}.
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

    for (const factory of asArray(spec)) {
      const ext = factory(target);

      Object.assign(entities, ext.entities);
    }

    return {
      entities,
    };
  };
}

export namespace URIChargeExt {
  /**
   * URI charge extension specifier.
   *
   * Either extension {@link Factory factory}, array of factories, or nothing.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   */
  export type Spec<TValue = unknown, TCharge = unknown> =
    | Factory<TValue, TCharge>
    | readonly Factory<TValue, TCharge>[]
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
}
