import { asArray } from '@proc7ts/primitives';
import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export class URIChargeExtParser<out TValue, out TCharge = unknown> {

  readonly #entities = new Map<string, URIChargeExt.EntityHandler<TValue, TCharge>>();
  readonly #directives = new Map<string, URIChargeExt.DirectiveHandler<TValue, TCharge>>();

  constructor(
    chargeRx: URIChargeRx<TValue, TCharge>,
    spec: URIChargeExt.Spec<TValue, TCharge> | undefined,
  ) {
    const exts = asArray(spec).map(spec => spec(chargeRx));

    for (const { entities } of exts) {
      if (entities) {
        for (const [rawEntity, entity] of Object.entries(entities)) {
          this.#entities.set(rawEntity, entity);
        }
      }
    }
    for (const { directives } of exts) {
      if (directives) {
        for (const [rawName, directive] of Object.entries(directives)) {
          this.#directives.set(rawName, directive);
        }
      }
    }
  }

  addEntity(rx: URIChargeRx.ValueRx<TValue, TCharge>, rawEntity: string): TCharge {
    const entityHandler = this.#entities.get(rawEntity);

    return entityHandler ? entityHandler(rx, rawEntity) : rx.setEntity(rawEntity);
  }

  rxDirective(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    const handler = this.#directives.get(rawName);

    return handler ? handler(rx, rawName, parse) : rx.rxDirective(rawName, parse);
  }

}
