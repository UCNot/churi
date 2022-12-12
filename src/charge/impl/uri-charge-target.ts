import { ChURIPrimitive } from '../ch-uri-value.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export abstract class URIChargeTarget<out TValue, out TCharge = unknown>
  implements URIChargeRx.ValueRx<TValue, TCharge> {

  readonly #chargeRx: URIChargeRx<TValue, TCharge>;
  readonly #extParser: URIChargeExtParser<TValue, TCharge>;

  constructor(
    chargeRx: URIChargeRx<TValue, TCharge>,
    extParser: URIChargeExtParser<TValue, TCharge>,
  ) {
    this.#chargeRx = chargeRx;
    this.#extParser = extParser;
  }

  get chargeRx(): URIChargeRx<TValue, TCharge> {
    return this.#chargeRx;
  }

  abstract set(charge: TCharge): TCharge;

  setEntity(rawEntity: string): TCharge {
    const handler = this.#extParser.forEntity(rawEntity);

    return handler ? handler(this, rawEntity) : this._setEntity(rawEntity);
  }

  protected abstract _setEntity(rawEntity: string): TCharge;

  abstract setValue(value: TValue | ChURIPrimitive, type: string): TCharge;

  abstract rxMap(
    parse: (rx: URIChargeRx.MapRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): TCharge;

  abstract rxList(
    parse: (rx: URIChargeRx.ListRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): TCharge;

  rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    const handler = this.#extParser.forDirective(rawName);

    return handler ? handler(this, rawName, parse) : this._rxDirective(rawName, parse);
  }

  get _extParser(): URIChargeExtParser<TValue, TCharge> {
    return this.#extParser;
  }

  protected abstract _rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge;

}

export class ChURIValueTarget<out TValue, out TCharge> extends URIChargeTarget<TValue, TCharge> {

  readonly #rx: URIChargeRx.ValueRx<TValue, TCharge>;

  constructor(rx: URIChargeRx.ValueRx<TValue, TCharge>, ext: URIChargeExtParser<TValue, TCharge>) {
    super(rx.chargeRx, ext);
    this.#rx = rx;
  }

  override set(charge: TCharge): TCharge {
    return this.#rx.set(charge);
  }

  override setValue(value: TValue | ChURIPrimitive, type: string): TCharge {
    return this.#rx.setValue(value, type);
  }

  override rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): TCharge {
    return this.#rx.rxMap(parse);
  }

  override rxList(parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): TCharge {
    return this.#rx.rxList(parse);
  }

  protected override _setEntity(rawEntity: string): TCharge {
    return this.#rx.setEntity(rawEntity);
  }

  protected override _rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    return this.#rx.rxDirective(rawName, parse);
  }

}

export class ChURIEntryTarget<out TValue> extends URIChargeTarget<TValue> {

  readonly #key: string;
  readonly #mapRx: URIChargeRx.MapRx<TValue>;

  constructor(parent: URIChargeTarget<TValue>, key: string, mapRx: URIChargeRx.MapRx<TValue>) {
    super(parent.chargeRx, parent._extParser);
    this.#key = key;
    this.#mapRx = mapRx;
  }

  forKey(key: string): ChURIEntryTarget<TValue> {
    return new ChURIEntryTarget(this, key, this.#mapRx);
  }

  override set(charge: unknown): void {
    this.#mapRx.put(this.#key, charge);
  }

  override setValue(value: ChURIPrimitive | TValue, type: string): void {
    this.#mapRx.putValue(this.#key, value, type);
  }

  override rxMap(parse: (rx: URIChargeRx.MapRx<TValue>) => void): void {
    this.#mapRx.rxMap(this.#key, parse);
  }

  override rxList(parse: (rx: URIChargeRx.ListRx<TValue>) => void): void {
    this.#mapRx.rxList(this.#key, parse);
  }

  addSuffix(): void {
    this.#mapRx.addSuffix(this.#key);
  }

  protected override _setEntity(rawEntity: string): void {
    this.#mapRx.putEntity(this.#key, rawEntity);
  }

  protected override _rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue>) => void,
  ): void {
    this.#mapRx.rxDirective(this.#key, rawName, parse);
  }

}

export class ChURIItemTarget<out TValue> extends URIChargeTarget<TValue> {

  readonly #itemsRx: URIChargeRx.ItemsRx<TValue>;

  constructor(parent: URIChargeTarget<TValue>, itemsRx: URIChargeRx.ItemsRx<TValue>) {
    super(parent.chargeRx, parent._extParser);
    this.#itemsRx = itemsRx;
  }

  override set(charge: unknown): unknown {
    return this.#itemsRx.add(charge);
  }

  override setValue(value: ChURIPrimitive | TValue, type: string): void {
    this.#itemsRx.addValue(value, type);
  }

  override rxMap(parse: (rx: URIChargeRx.MapRx<TValue>) => void): void {
    this.#itemsRx.rxMap(parse);
  }

  override rxList(parse: (rx: URIChargeRx.ListRx<TValue>) => void): void {
    this.#itemsRx.rxList(parse);
  }

  protected override _setEntity(rawEntity: string): void {
    this.#itemsRx.addEntity(rawEntity);
  }

  protected override _rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue>) => void,
  ): void {
    this.#itemsRx.rxDirective(rawName, parse);
  }

}
