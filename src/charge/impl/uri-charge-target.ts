import { ChURIPrimitive } from '../ch-uri-value.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { ChURIValueDecoder } from './ch-uri-value-decoder.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export interface URIChargeTarget<out TValue, out TCharge = unknown> {
  readonly decoder: ChURIValueDecoder;
  readonly rx: URIChargeRx.ValueRx<TValue, TCharge>;
  readonly ext: URIChargeExtParser<TValue, TCharge>;

  decode(input: string): TCharge;
}

export class ChURIMapEntryTarget<out TValue>
  implements URIChargeTarget<TValue>, URIChargeRx.ValueRx<TValue> {

  readonly #key: string;
  readonly #mapRx: URIChargeRx.MapRx<TValue>;
  readonly #decoder: ChURIValueDecoder;
  readonly #ext: URIChargeExtParser<TValue>;

  constructor(
    parent: URIChargeTarget<TValue>,
    key: string,
    mapRx: URIChargeRx.MapRx<TValue>,
    decoder: ChURIValueDecoder = parent.decoder,
  ) {
    this.#key = key;
    this.#mapRx = mapRx;
    this.#decoder = decoder;
    this.#ext = parent.ext;
  }

  get chargeRx(): URIChargeRx<TValue> {
    return this.#mapRx.chargeRx;
  }

  get decoder(): ChURIValueDecoder {
    return this.#decoder;
  }

  get rx(): URIChargeRx.ValueRx<TValue> {
    return this;
  }

  get ext(): URIChargeExtParser<TValue> {
    return this.#ext;
  }

  decode(input: string): unknown {
    return this.#decoder.decodeValue(this, input);
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

  startMap(): URIChargeRx.MapRx<TValue> {
    return this.#mapRx.startMap(this.#key);
  }

  startList(): URIChargeRx.ListRx<TValue> {
    return this.#mapRx.startList(this.#key);
  }

  startDirective(rawName: string): URIChargeRx.DirectiveRx<TValue> {
    return this.#mapRx.startDirective(this.#key, rawName);
  }

  addSuffix(): void {
    this.#mapRx.addSuffix(this.#key);
  }

}

abstract class ChURIItemTarget<out TValue, TRx extends URIChargeRx.ItemsRx<TValue>>
  implements URIChargeTarget<TValue>, URIChargeRx.ValueRx<TValue> {

  readonly #decoder: ChURIValueDecoder;
  readonly #ext: URIChargeExtParser<TValue, unknown>;

  constructor(parent: URIChargeTarget<TValue>, protected readonly itemsRx: TRx) {
    this.#decoder = parent.decoder;
    this.#ext = parent.ext;
  }

  get chargeRx(): URIChargeRx<TValue> {
    return this.itemsRx.chargeRx;
  }

  get rx(): this {
    return this;
  }

  get decoder(): ChURIValueDecoder {
    return this.#decoder;
  }

  get ext(): URIChargeExtParser<TValue> {
    return this.#ext;
  }

  decode(input: string): unknown {
    return this.#decoder.decodeValue(this, input);
  }

  set(charge: unknown): unknown {
    return this.itemsRx.add(charge);
  }

  setEntity(rawEntity: string): void {
    this.itemsRx.addEntity(rawEntity);
  }

  setValue(value: ChURIPrimitive | TValue, type: string): void {
    this.itemsRx.addValue(value, type);
  }

  startMap(): URIChargeRx.MapRx<TValue> {
    return this.itemsRx.startMap();
  }

  startList(): URIChargeRx.ListRx<TValue> {
    return this.itemsRx.startList();
  }

  startDirective(rawName: string): URIChargeRx.DirectiveRx<TValue> {
    return this.itemsRx.startDirective(rawName);
  }

}

export class ChURIListItemTarget<out TValue> extends ChURIItemTarget<
  TValue,
  URIChargeRx.ListRx<TValue>
> {

  endList(): void {
    this.itemsRx.endList();
  }

}

export class ChURIDirectiveArgsTarget<out TValue> extends ChURIItemTarget<
  TValue,
  URIChargeRx.DirectiveRx<TValue>
> {}
