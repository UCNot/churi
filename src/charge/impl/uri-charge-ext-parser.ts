import { asArray } from '@proc7ts/primitives';
import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { URIChargeTarget } from './uri-charge-target.js';

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

  addEntity(to: URIChargeTarget<TValue, TCharge>, rawEntity: string): TCharge {
    const entityHandler = this.#entities.get(rawEntity);

    return entityHandler
      ? entityHandler(new URIChargeExtContext(to), rawEntity)
      : to.rx.setEntity(rawEntity);
  }

  rxDirective(
    to: URIChargeTarget<TValue, TCharge>,
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    const handler = this.#directives.get(rawName);

    return handler
      ? handler(new URIChargeExtContext(to), rawName, parse)
      : to.rx.rxDirective(rawName, parse);
  }

}

class URIChargeExtContext<out TValue, out TCharge>
  implements URIChargeExt.Context<TValue, TCharge> {

  readonly #to: URIChargeTarget<TValue, TCharge>;

  constructor(to: URIChargeTarget<TValue, TCharge>) {
    this.#to = to;
  }

  get rx(): URIChargeRx.ValueRx<TValue, TCharge> {
    return this.#to.rx;
  }

}
