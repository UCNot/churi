import { asArray } from '@proc7ts/primitives';
import { URIChargeRx } from './uri-charge-rx.js';

/**
 * URI charge extension.
 *
 * Can be passed to {@link URIChargeParser} to add support for custom entities and directives.
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

  /**
   * Supported directives.
   *
   * An object literal with directive name as its key, and directive handler as value.
   */
  readonly directives?:
    | {
        readonly [rawName: string]: URIChargeExt.DirectiveHandler<TValue, TCharge>;
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
  return (chargeRx: URIChargeRx<TValue, TCharge>): URIChargeExt<TValue, TCharge> => {
    const entities: Record<string, URIChargeExt.EntityHandler<TCharge>> = {};
    const directives: Record<string, URIChargeExt.DirectiveHandler<TValue, TCharge>> = {};

    for (const factory of asArray(spec)) {
      const ext = factory(chargeRx);

      Object.assign(entities, ext.entities);
      Object.assign(directives, ext.directives);
    }

    return {
      entities,
      directives,
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
   * @param chargeRx - Target URI charge receiver.
   *
   * @returns Extension instance.
   */
  export type Factory<out TValue = unknown, out TCharge = unknown> = {
    extendCharge(chargeRx: URIChargeRx<TValue, TCharge>): URIChargeExt<TValue, TCharge>;
  }['extendCharge'];

  /**
   * Custom entity handler.
   *
   * Creates an entity charge out of raw string.
   *
   * @typeParam TCharge - URI charge representation type.
   * @param rawEntity - The entity as is, with leading `!` and _not_ URI-decoded.
   *
   * @returns URI charge representing entity.
   */
  export type EntityHandler<out TCharge = unknown> = {
    createEntity(rawEntity: string): TCharge;
  }['createEntity'];

  /**
   * Custom directive handler.
   *
   * Builds a charge out of visited directive arguments.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   * @param rawName - Directive name as is, with leading `!` and _not_ URI-decoded.
   * @param build - Charge builder function accepting directive arguments receiver and building a charge with it.
   *
   * @returns Built charge.
   */
  export type DirectiveHandler<out TValue = unknown, out TCharge = unknown> = {
    rxDirective(
      rawName: string,
      build: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
    ): TCharge;
  }['rxDirective'];
}
