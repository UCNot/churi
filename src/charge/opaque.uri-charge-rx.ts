import { UcPrimitive } from './uc-value.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class OpaqueURIChargeRx<out TValue = UcPrimitive, out TCharge = unknown>
  implements URIChargeRx<TValue, TCharge> {

  static get ValueRx(): URIChargeRx.ValueRx.Constructor {
    return OpaqueURICharge$ValueRx;
  }

  static get MapRx(): URIChargeRx.MapRx.Constructor {
    return OpaqueURICharge$MapRx;
  }

  readonly #none: TCharge;

  constructor({ none }: URIChargeRx.Init<TCharge>) {
    this.#none = none;
  }

  get ns(): URIChargeRx.Namespace {
    return this.constructor as typeof OpaqueURIChargeRx<TValue, TCharge>;
  }

  get none(): TCharge {
    return this.#none;
  }

  createEntity(_rawEntity: string): TCharge {
    return this.none;
  }

  createValue(_value: TValue | UcPrimitive, _type: string): TCharge {
    return this.none;
  }

  rxValue(parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge {
    return parse(new this.ns.ValueRx(this));
  }

  rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): TCharge {
    return parse(new this.ns.MapRx(this));
  }

  rxList(parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge {
    return this.rxValue(parse);
  }

  rxDirective(
    _rawName: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    return this.rxValue(parse);
  }

}

class OpaqueURICharge$ValueRx<out TValue, out TCharge, out TRx extends URIChargeRx<TValue, TCharge>>
  implements URIChargeRx.ValueRx<TValue, TCharge, TRx> {

  readonly #chargeRx: TRx;

  constructor(chargeRx: TRx) {
    this.#chargeRx = chargeRx;
  }

  get chargeRx(): TRx {
    return this.#chargeRx;
  }

  add(_charge: TCharge): void {
    // Ignore charge.
  }

  addEntity(rawEntity: string): void {
    this.add(this.#chargeRx.createEntity(rawEntity));
  }

  addValue(value: UcPrimitive | TValue, type: string): void {
    this.add(this.#chargeRx.createValue(value, type));
  }

  rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): void {
    this.add(this.chargeRx.rxMap(parse));
  }

  rxList(parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): void {
    this.add(this.chargeRx.rxList(parse));
  }

  rxDirective(rawName: string, parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): void {
    this.add(this.#chargeRx.rxDirective(rawName, parse));
  }

  end(): TCharge {
    return this.#chargeRx.none;
  }

}

class OpaqueURICharge$MapRx<out TValue, out TCharge, out TRx extends URIChargeRx<TValue, TCharge>>
  implements URIChargeRx.MapRx<TValue, TCharge, TRx> {

  readonly #chargeRx: TRx;

  constructor(chargeRx: TRx) {
    this.#chargeRx = chargeRx;
  }

  get chargeRx(): TRx {
    return this.#chargeRx;
  }

  put(_key: string, _charge: TCharge): void {
    // Ignore entity charge.
  }

  putEntity(key: string, rawEntity: string): void {
    this.put(key, this.#chargeRx.createEntity(rawEntity));
  }

  putValue(key: string, value: UcPrimitive | TValue, type: string): void {
    this.put(key, this.#chargeRx.createValue(value, type));
  }

  rxMap(key: string, parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): void {
    this.put(key, this.#chargeRx.rxMap(parse));
  }

  rxList(key: string, parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): void {
    this.put(key, this.#chargeRx.rxList(parse));
  }

  rxDirective(
    key: string,
    rawName: string,
    parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge,
  ): void {
    this.put(key, this.#chargeRx.rxDirective(rawName, parse));
  }

  addSuffix(suffix: string): void {
    this.putValue(suffix, '', 'string');
  }

  endMap(): TCharge {
    return this.#chargeRx.none;
  }

}
