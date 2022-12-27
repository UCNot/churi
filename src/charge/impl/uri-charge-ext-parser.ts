import { asArray } from '@proc7ts/primitives';
import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export class URIChargeExtParser<out TValue, out TCharge = unknown> {

  readonly #target: URIChargeExt.Target<TValue, TCharge>;
  readonly #specs: URIChargeExt.Factory<TValue, TCharge>[];

  #entities?: Map<string, URIChargeExt.EntityHandler<TCharge>>;
  #directives?: Map<string, URIChargeExt.DirectiveHandler<TCharge>>;

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
    this.#directives = new Map();

    const exts = this.#specs.map(spec => spec(this.#target));

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

  parseDirective(rx: URIChargeRx.ValueRx<TValue, TCharge>, rawName: string, rawArg: string): void {
    this.#init();

    const directive = this.#directives!.get(rawName);

    if (directive) {
      rx.add(directive(rawName, rawArg));
    } else {
      rx.addDirective(rawName, rawArg);
    }
  }

}
