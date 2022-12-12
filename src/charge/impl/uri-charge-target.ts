import { ChURIPrimitive } from '../ch-uri-value.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export interface URIChargeTarget<out TValue, out TCharge = unknown> {
  readonly rx: URIChargeRx.ValueRx<TValue, TCharge>;
  readonly ext: URIChargeExtParser<TValue, TCharge>;
}

export class ChURIMapEntryTarget<out TValue>
  implements URIChargeTarget<TValue>, URIChargeRx.ValueRx<TValue> {

  readonly #key: string;
  readonly #mapRx: URIChargeRx.MapRx<TValue>;
  readonly #ext: URIChargeExtParser<TValue>;

  constructor(parent: URIChargeTarget<TValue>, key: string, mapRx: URIChargeRx.MapRx<TValue>) {
    this.#key = key;
    this.#mapRx = mapRx;
    this.#ext = parent.ext;
  }

  get chargeRx(): URIChargeRx<TValue> {
    return this.#mapRx.chargeRx;
  }

  get rx(): URIChargeRx.ValueRx<TValue> {
    return this;
  }

  get ext(): URIChargeExtParser<TValue> {
    return this.#ext;
  }

  forKey(key: string): ChURIMapEntryTarget<TValue> {
    return new ChURIMapEntryTarget(this, key, this.#mapRx);
  }

  set(charge: unknown): void {
    this.#mapRx.put(this.#key, charge);
  }

  setEntity(rawEntity: string): void {
    this.#mapRx.putEntity(this.#key, rawEntity);
  }

  setValue(value: ChURIPrimitive | TValue, type: string): void {
    this.#mapRx.putValue(this.#key, value, type);
  }

  rxMap(parse: (rx: URIChargeRx.MapRx<TValue>) => void): void {
    this.#mapRx.rxMap(this.#key, parse);
  }

  rxList(parse: (rx: URIChargeRx.ListRx<TValue>) => void): void {
    this.#mapRx.rxList(this.#key, parse);
  }

  rxDirective(rawName: string, parse: (rx: URIChargeRx.DirectiveRx<TValue>) => void): void {
    this.#mapRx.rxDirective(this.#key, rawName, parse);
  }

  addSuffix(): void {
    this.#mapRx.addSuffix(this.#key);
  }

}

export class ChURIItemTarget<out TValue>
  implements URIChargeTarget<TValue>, URIChargeRx.ValueRx<TValue> {

  readonly #ext: URIChargeExtParser<TValue, unknown>;
  readonly #itemsRx: URIChargeRx.ItemsRx<TValue>;

  constructor(parent: URIChargeTarget<TValue>, itemsRx: URIChargeRx.ItemsRx<TValue>) {
    this.#ext = parent.ext;
    this.#itemsRx = itemsRx;
  }

  get chargeRx(): URIChargeRx<TValue> {
    return this.#itemsRx.chargeRx;
  }

  get rx(): this {
    return this;
  }

  get ext(): URIChargeExtParser<TValue> {
    return this.#ext;
  }

  set(charge: unknown): unknown {
    return this.#itemsRx.add(charge);
  }

  setEntity(rawEntity: string): void {
    this.#itemsRx.addEntity(rawEntity);
  }

  setValue(value: ChURIPrimitive | TValue, type: string): void {
    this.#itemsRx.addValue(value, type);
  }

  rxMap(parse: (rx: URIChargeRx.MapRx<TValue>) => void): void {
    this.#itemsRx.rxMap(parse);
  }

  rxList(parse: (rx: URIChargeRx.ListRx<TValue>) => void): void {
    this.#itemsRx.rxList(parse);
  }

  rxDirective(rawName: string, parse: (rx: URIChargeRx.DirectiveRx<TValue>) => void): void {
    this.#itemsRx.rxDirective(rawName, parse);
  }

}
