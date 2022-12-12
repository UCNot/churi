import { asArray } from '@proc7ts/primitives';
import { URIChargeRx } from './uri-charge-rx.js';

export interface URIChargeExt<out TValue = unknown, out TCharge = unknown> {
  readonly entities?:
    | {
        readonly [rawEntity: string]: URIChargeExt.EntityHandler<TValue, TCharge>;
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
  return <TVal extends TValue, TCh extends TCharge>(
    chargeRx: URIChargeRx<TVal, TCh>,
  ): URIChargeExt<TVal, TCh> => {
    const entities: Record<string, URIChargeExt.EntityHandler<TVal, TCh>> = {};
    const directives: Record<string, URIChargeExt.DirectiveHandler<TVal, TCh>> = {};

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

  export interface Context<out TValue = unknown, out TCharge = unknown> {
    readonly rx: URIChargeRx.ValueRx<TValue, TCharge>;
  }

  export type EntityHandler<out TValue = unknown, out TCharge = unknown> = {
    createEntity(context: Context<TValue, TCharge>, rawEntity: string): TCharge;
  }['createEntity'];

  export type DirectiveHandler<out TValue = unknown, out TCharge = unknown> = {
    rxDirective(
      context: Context<TValue, TCharge>,
      rawName: string,
      parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
    ): TCharge;
  }['rxDirective'];
}
