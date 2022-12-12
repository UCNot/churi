import { ChURIPrimitive } from '../ch-uri-value.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export type AnyURIChargeRx<TValue, TCharge = unknown> =
  | URIChargeRx.ValueRx<TValue, TCharge>
  | URIChargeRx.MapRx<TValue, TCharge>
  | URIChargeRx.ItemsRx<TValue, TCharge>;

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

  abstract set(rx: TRx, key: string, charge: TCharge): TCharge;

  setEntity(rx: TRx, key: string, rawEntity: string): TCharge {
    const handler = this.#ext.forEntity(rawEntity);

    if (handler) {
      return this.set(rx, key, handler(rawEntity));
    }

    return this._setEntity(rx, key, rawEntity);
  }

  protected abstract _setEntity(rx: TRx, key: string, rawEntity: string): TCharge;

  abstract setValue(rx: TRx, key: string, value: TValue | ChURIPrimitive, type: string): TCharge;

  abstract rxMap(
    rx: TRx,
    key: string,
    parse: (rx: URIChargeRx.MapRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): TCharge;

  abstract rxList(
    rx: TRx,
    key: string,
    parse: (rx: URIChargeRx.ListRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): TCharge;

  rxDirective(
    rx: TRx,
    key: string,
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    const handler = this.#ext.forDirective(rawName);

    if (handler) {
      return this.set(rx, key, handler(rawName, parse));
    }

    return this._rxDirective(rx, key, rawName, parse);
  }

  protected abstract _rxDirective(
    rx: TRx,
    key: string,
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge;

}

export class URIChargeValueTarget<out TValue, out TCharge> extends URIChargeTarget<
  TValue,
  TCharge,
  URIChargeRx.ValueRx<TValue, TCharge>
> {

  override set(rx: URIChargeRx.ValueRx<TValue, TCharge>, _key: string, charge: TCharge): TCharge {
    return rx.set(charge);
  }

  override setValue(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    value: TValue | ChURIPrimitive,
    type: string,
  ): TCharge {
    return rx.setValue(value, type);
  }

  override rxMap(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    return rx.rxMap(parse);
  }

  override rxList(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    return rx.rxList(parse);
  }

  protected override _setEntity(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    rawEntity: string,
  ): TCharge {
    return rx.setEntity(rawEntity);
  }

  protected override _rxDirective(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    _key: string,
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    return rx.rxDirective(rawName, parse);
  }

}

export class URIChargeEntryTarget<out TValue> extends URIChargeTarget<
  TValue,
  unknown,
  URIChargeRx.MapRx<TValue>
> {

  override set(rx: URIChargeRx.MapRx<TValue>, key: string, charge: unknown): void {
    rx.put(key, charge);
  }

  override setValue(
    rx: URIChargeRx.MapRx<TValue>,
    key: string,
    value: ChURIPrimitive | TValue,
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
    parse: (rx: URIChargeRx.ListRx<TValue>) => void,
  ): void {
    rx.rxList(key, parse);
  }

  protected override _setEntity(
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
    parse: (rx: URIChargeRx.DirectiveRx<TValue>) => void,
  ): void {
    rx.rxDirective(key, rawName, parse);
  }

}

export class URIChargeItemTarget<out TValue> extends URIChargeTarget<
  TValue,
  unknown,
  URIChargeRx.ItemsRx<TValue>
> {

  override set(rx: URIChargeRx.ItemsRx<TValue>, _key: string, charge: unknown): void {
    rx.add(charge);
  }

  override setValue(
    rx: URIChargeRx.ItemsRx<TValue>,
    _key: string,
    value: ChURIPrimitive | TValue,
    type: string,
  ): void {
    rx.addValue(value, type);
  }

  override rxMap(
    rx: URIChargeRx.ItemsRx<TValue>,
    _key: string,
    parse: (rx: URIChargeRx.MapRx<TValue>) => void,
  ): void {
    rx.rxMap(parse);
  }

  override rxList(
    rx: URIChargeRx.ItemsRx<TValue>,
    _key: string,
    parse: (rx: URIChargeRx.ListRx<TValue>) => void,
  ): void {
    rx.rxList(parse);
  }

  protected override _setEntity(
    rx: URIChargeRx.ItemsRx<TValue>,
    _key: string,
    rawEntity: string,
  ): void {
    rx.addEntity(rawEntity);
  }

  protected override _rxDirective(
    rx: URIChargeRx.ItemsRx<TValue>,
    _key: string,
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue>) => void,
  ): void {
    rx.rxDirective(rawName, parse);
  }

}
