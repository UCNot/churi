import { asArray } from '@proc7ts/primitives';
import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export class URIChargeExtParser<out TValue, out TCharge = unknown> {

  readonly #chargeRx: URIChargeRx<TValue, TCharge>;
  readonly #specs: URIChargeExt.Factory<TValue, TCharge>[];

  #entities?: Map<string, URIChargeExt.EntityHandler<TCharge>>;
  #directives?: Map<string, URIChargeExt.DirectiveHandler<TValue, TCharge>>;

  constructor(
    chargeRx: URIChargeRx<TValue, TCharge>,
    spec: URIChargeExt.Spec<TValue, TCharge> | undefined,
  ) {
    this.#chargeRx = chargeRx;
    this.#specs = asArray(spec);
  }

  #init(): void {
    if (this.#entities) {
      return;
    }

    this.#entities = new Map();
    this.#directives = new Map();

    const exts = this.#specs.map(spec => spec(this.#chargeRx));

    for (const { entities, directives } of exts) {
      if (entities) {
        for (const [rawEntity, entity] of Object.entries(entities)) {
          this.#entities.set(rawEntity, entity);
        }
      }
      if (directives) {
        for (const [rawName, directive] of Object.entries(directives)) {
          this.#directives.set(rawName, directive);
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

  rxDirective(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    rawName: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
  ): void {
    this.#init();

    const directive = this.#directives!.get(rawName);

    if (directive) {
      rx.add(directive(rawName, parse));
    } else {
      rx.rxDirective(rawName, parse);
    }
  }

}
