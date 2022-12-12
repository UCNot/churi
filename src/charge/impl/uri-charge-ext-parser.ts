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

  forEntity(rawEntity: string): URIChargeExt.EntityHandler<TValue, TCharge> | undefined {
    return this.#entities.get(rawEntity);
  }

  forDirective(rawName: string): URIChargeExt.DirectiveHandler<TValue, TCharge> | undefined {
    return this.#directives.get(rawName);
  }

}
