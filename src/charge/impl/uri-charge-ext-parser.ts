import { asArray } from '@proc7ts/primitives';
import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export class URIChargeExtParser<out TValue, out TCharge = unknown> {

  readonly #target: URIChargeExt.Target<TValue, TCharge>;
  readonly #specs: URIChargeExt.Factory<TValue, TCharge>[];

  #entities?: Map<string, URIChargeExt.EntityHandler<TCharge>>;

  constructor(
    target: URIChargeExt.Target<TValue, TCharge>,
    spec: URIChargeExt.Spec<TValue, TCharge> | undefined,
  ) {
    this.#target = target;
    this.#specs = asArray(spec);
  }

  #init(): void {
    if (this.#entities) {
      return;
    }

    this.#entities = new Map();

    const exts = this.#specs.map(spec => spec(this.#target));

    for (const { entities } of exts) {
      if (entities) {
        for (const [rawEntity, entity] of Object.entries(entities)) {
          this.#entities.set(rawEntity, entity);
        }
      }
    }
  }

  parseEntity(rx: URIChargeRx.ValueRx<TValue, TCharge>, rawEntity: string): void {
    this.#init();

    const handler = this.#entities!.get(rawEntity);

    if (handler) {
      rx.add(handler(rawEntity));
    } else {
      rx.addEntity(rawEntity);
    }
  }

}
