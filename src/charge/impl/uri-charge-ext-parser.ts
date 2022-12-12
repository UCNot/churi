import { asArray } from '@proc7ts/primitives';
import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import {
  URIChargeEntryTarget,
  URIChargeItemTarget,
  URIChargeValueTarget,
} from './uri-charge-target.js';

export class URIChargeExtParser<out TValue, out TCharge = unknown> {

  readonly #chargeRx: URIChargeRx<TValue, TCharge>;
  readonly #specs: URIChargeExt.Factory<TValue, TCharge>[];

  #entities?: Map<string, URIChargeExt.EntityHandler<TValue, TCharge>>;
  #directives?: Map<string, URIChargeExt.DirectiveHandler<TValue, TCharge>>;

  #valueTarget?: URIChargeValueTarget<TValue, TCharge>;
  #entryTarget?: URIChargeEntryTarget<TValue>;
  #itemTarget?: URIChargeItemTarget<TValue>;

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

  get chargeRx(): URIChargeRx<TValue, TCharge> {
    return this.#chargeRx;
  }

  forEntity(rawEntity: string): URIChargeExt.EntityHandler<TValue, TCharge> | undefined {
    this.#init();

    return this.#entities!.get(rawEntity);
  }

  forDirective(rawName: string): URIChargeExt.DirectiveHandler<TValue, TCharge> | undefined {
    this.#init();

    return this.#directives!.get(rawName);
  }

  get valueTarget(): URIChargeValueTarget<TValue, TCharge> {
    return (this.#valueTarget ??= new URIChargeValueTarget(this));
  }

  get entryTarget(): URIChargeEntryTarget<TValue> {
    return (this.#entryTarget ??= new URIChargeEntryTarget(this));
  }

  get itemTarget(): URIChargeItemTarget<TValue> {
    return (this.#itemTarget ??= new URIChargeItemTarget(this));
  }

}
