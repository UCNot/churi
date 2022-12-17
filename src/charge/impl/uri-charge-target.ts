import { UcPrimitive } from '../uc-value.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export type AnyURIChargeRx<TValue, TCharge = unknown> =
  | URIChargeRx.ValueRx<TValue, TCharge>
  | URIChargeRx.MapRx<TValue, TCharge>;

export abstract class URIChargeTarget<
  out TValue,
  out TCharge = unknown,
  in TRx extends AnyURIChargeRx<TValue, TCharge> = AnyURIChargeRx<TValue, TCharge>,
> {

  readonly #ext: URIChargeExtParser<TValue, TCharge>;

  constructor(ext: URIChargeExtParser<TValue, TCharge>) {
    this.#ext = ext;
  }

  get ext(): URIChargeExtParser<TValue, TCharge> {
    return this.#ext;
  }

  abstract add(rx: TRx, key: string, charge: TCharge): void;

  addEntity(rx: TRx, key: string, rawEntity: string): void {
    const handler = this.#ext.forEntity(rawEntity);

    if (handler) {
      this.add(rx, key, handler(rawEntity));
    } else {
      this._addEntity(rx, key, rawEntity);
    }
  }

  protected abstract _addEntity(rx: TRx, key: string, rawEntity: string): void;

  abstract addValue(rx: TRx, key: string, value: TValue | UcPrimitive, type: string): void;

  abstract rxMap(
    rx: TRx,
    key: string,
    parse: (rx: URIChargeRx.MapRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): void;

  abstract rxList(
    rx: TRx,
    key: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): void;

  rxDirective(
    rx: TRx,
    key: string,
    rawName: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
  ): void {
    const handler = this.#ext.forDirective(rawName);

    if (handler) {
      this.add(rx, key, handler(rawName, parse));
    } else {
      this._rxDirective(rx, key, rawName, parse);
    }
  }

  protected abstract _rxDirective(
    rx: TRx,
    key: string,
    rawName: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
  ): void;

}

export class URIChargeValueTarget<out TValue, out TCharge = unknown> extends URIChargeTarget<
  TValue,
  TCharge,
  URIChargeRx.ValueRx<TValue, TCharge>
> {

  override add(rx: URIChargeRx.ValueRx<TValue, TCharge>, _key: string, charge: TCharge): void {
    rx.add(charge);
  }

  override addValue(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    value: TValue | UcPrimitive,
    type: string,
  ): void {
    rx.addValue(value, type);
  }

  override rxMap(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge,
  ): void {
    rx.rxMap(parse);
  }

  override rxList(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
  ): void {
    rx.rxList(parse);
  }

  protected override _addEntity(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    rawEntity: string,
  ): void {
    rx.addEntity(rawEntity);
  }

  protected override _rxDirective(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    rawName: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
  ): void {
    rx.rxDirective(rawName, parse);
  }

}

export class URIChargeEntryTarget<out TValue> extends URIChargeTarget<
  TValue,
  unknown,
  URIChargeRx.MapRx<TValue>
> {

  override add(rx: URIChargeRx.MapRx<TValue>, key: string, charge: unknown): void {
    rx.put(key, charge);
  }

  override addValue(
    rx: URIChargeRx.MapRx<TValue>,
    key: string,
    value: UcPrimitive | TValue,
    type: string,
  ): void {
    rx.putValue(key, value, type);
  }

  override rxMap(
    rx: URIChargeRx.MapRx<TValue>,
    key: string,
    parse: (rx: URIChargeRx.MapRx<TValue>) => void,
  ): void {
    rx.rxMap(key, parse);
  }

  override rxList(
    rx: URIChargeRx.MapRx<TValue>,
    key: string,
    parse: (rx: URIChargeRx.ValueRx<TValue>) => void,
  ): void {
    rx.rxList(key, parse);
  }

  protected override _addEntity(
    rx: URIChargeRx.MapRx<TValue>,
    key: string,
    rawEntity: string,
  ): void {
    rx.putEntity(key, rawEntity);
  }

  protected override _rxDirective(
    rx: URIChargeRx.MapRx<TValue>,
    key: string,
    rawName: string,
    parse: (rx: URIChargeRx.ValueRx<TValue>) => void,
  ): void {
    rx.rxDirective(key, rawName, parse);
  }

}
