import { asArray } from '@proc7ts/primitives';
import { URIChargeRx } from './uri-charge-rx.js';

export interface URIChargeExt<out TValue = unknown, out TCharge = unknown> {
  readonly entities?:
    | {
        readonly [rawEntity: string]: URIChargeExt.EntityHandler<TCharge>;
      }
    | undefined;
  readonly directives?:
    | {
        readonly [rawName: string]: URIChargeExt.DirectiveHandler<TValue, TCharge>;
      }
    | undefined;
}

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
  export type Spec<TValue = unknown, TCharge = unknown> =
    | Factory<TValue, TCharge>
    | readonly Factory<TValue, TCharge>[]
    | undefined;

  export type Factory<out TValue = unknown, out TCharge = unknown> = {
    extendCharge(chargeRx: URIChargeRx<TValue, TCharge>): URIChargeExt<TValue, TCharge>;
  }['extendCharge'];

  export type EntityHandler<out TCharge = unknown> = {
    createEntity(rawEntity: string): TCharge;
  }['createEntity'];

  export type DirectiveHandler<out TValue = unknown, out TCharge = unknown> = {
    rxDirective(
      rawName: string,
      parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
    ): TCharge;
  }['rxDirective'];
}
