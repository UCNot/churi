import { ChURIPrimitive } from './ch-uri-value.js';
import { PassURICharge } from './impl/pass-uri-charge.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class OpaqueURIChargeRx<in TValue = ChURIPrimitive, out TCharge = unknown>
  implements URIChargeRx<TValue, TCharge> {

  static get ValueRx(): URIChargeRx.ValueRx.Constructor {
    return OpaqueURICharge$ValueRx;
  }

  static get MapRx(): URIChargeRx.MapRx.Constructor {
    return OpaqueURICharge$MapRx;
  }

  static get ItemsRx(): URIChargeRx.ItemsRx.Constructor {
    return OpaqueURICharge$ItemsRx;
  }

  static get ListRx(): URIChargeRx.ListRx.Constructor {
    return OpaqueURICharge$ListRx;
  }

  static get DirectiveRx(): URIChargeRx.DirectiveRx.Constructor {
    return OpaqueURICharge$DirectiveRx;
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

  createValue(_value: TValue | ChURIPrimitive, _type: string): TCharge {
    return this.none;
  }

  createEntity(_rawEntity: string): TCharge {
    return this.none;
  }

  rxValue(endValue?: URIChargeRx.End<TCharge>): URIChargeRx.ValueRx<TValue, TCharge> {
    return new this.ns.ValueRx(this, endValue);
  }

  rxMap(endMap?: URIChargeRx.End<TCharge>): URIChargeRx.MapRx<TValue, TCharge> {
    return new this.ns.MapRx(this, endMap);
  }

  rxList(endList?: URIChargeRx.End<TCharge>): URIChargeRx.ListRx<TValue, TCharge> {
    return new this.ns.ListRx(this, endList);
  }

  rxDirective(
    rawName: string,
    endDirective?: URIChargeRx.End<TCharge> | undefined,
  ): URIChargeRx.DirectiveRx<TValue, TCharge> {
    return new this.ns.DirectiveRx(this, rawName, endDirective);
  }

}

class OpaqueURICharge$ValueRx<in TValue, out TCharge>
  implements URIChargeRx.ValueRx<TValue, TCharge> {

  readonly #chargeRx: URIChargeRx<TValue, TCharge>;
  readonly #passCharge: PassURICharge<TCharge>;

  constructor(chargeRx: URIChargeRx<TValue, TCharge>, endCharge?: URIChargeRx.End<TCharge>) {
    this.#chargeRx = chargeRx;
    this.#passCharge = PassURICharge(endCharge);
  }

  get chargeRx(): URIChargeRx<TValue, TCharge> {
    return this.#chargeRx;
  }

  set(value: ChURIPrimitive | TValue, type: string): TCharge {
    return this.setCharge(this.#chargeRx.createValue(value, type));
  }

  setCharge(charge: TCharge): TCharge {
    return this.#passCharge(charge);
  }

  setEntity(rawEntity: string): TCharge {
    return this.setCharge(this.#chargeRx.createEntity(rawEntity));
  }

  startMap(): URIChargeRx.MapRx<TValue, TCharge> {
    return this.#chargeRx.rxMap(this.#passCharge);
  }

  startList(): URIChargeRx.ListRx<TValue, TCharge> {
    return this.#chargeRx.rxList(this.#passCharge);
  }

  startDirective(rawName: string): URIChargeRx.DirectiveRx<TValue, TCharge> {
    return this.#chargeRx.rxDirective(rawName, this.#passCharge);
  }

}

class OpaqueURICharge$MapRx<in TValue = ChURIPrimitive, out TCharge = unknown>
  implements URIChargeRx.MapRx<TValue, TCharge> {

  readonly #chargeRx: URIChargeRx<TValue, TCharge>;

  constructor(chargeRx: URIChargeRx<TValue, TCharge>) {
    this.#chargeRx = chargeRx;
  }

  get chargeRx(): URIChargeRx<TValue, TCharge> {
    return this.#chargeRx;
  }

  put(key: string, value: ChURIPrimitive | TValue, type: string): void {
    this.putCharge(key, this.#chargeRx.createValue(value, type));
  }

  putCharge(_key: string, _charge: TCharge): void {
    // Ignore entity charge
  }

  putEntity(key: string, rawEntity: string): void {
    this.putCharge(key, this.#chargeRx.createEntity(rawEntity));
  }

  startMap(key: string): URIChargeRx.MapRx<TValue> {
    return this.#chargeRx.rxMap(map => this.putCharge(key, map));
  }

  startList(key: string): URIChargeRx.ListRx<TValue> {
    return this.#chargeRx.rxList(list => this.putCharge(key, list));
  }

  startDirective(key: string, rawName: string): URIChargeRx.DirectiveRx<TValue> {
    return this.#chargeRx.rxDirective(rawName, directive => this.putCharge(key, directive));
  }

  addSuffix(suffix: string): void {
    this.startMap(suffix).endMap();
  }

  endMap(): TCharge {
    return this.#chargeRx.none;
  }

}

abstract class OpaqueURICharge$ItemsRx<in TValue = ChURIPrimitive, out TCharge = unknown>
  implements URIChargeRx.ItemsRx<TValue, TCharge> {

  readonly #chargeRx: URIChargeRx<TValue, TCharge>;

  constructor(chargeRx: URIChargeRx<TValue, TCharge>) {
    this.#chargeRx = chargeRx;
  }

  get chargeRx(): URIChargeRx<TValue, TCharge> {
    return this.#chargeRx;
  }

  add(value: ChURIPrimitive | TValue, type: string): void {
    this.addCharge(this.#chargeRx.createValue(value, type));
  }

  addCharge(_charge: TCharge): void {
    // Ignore item charge
  }

  addEntity(rawEntity: string): void {
    this.addCharge(this.#chargeRx.createEntity(rawEntity));
  }

  startMap(): URIChargeRx.MapRx<TValue> {
    return this.#chargeRx.rxMap(map => this.addCharge(map));
  }

  startList(): URIChargeRx.ListRx<TValue> {
    return this.#chargeRx.rxList(list => this.addCharge(list));
  }

  startDirective(rawName: string): URIChargeRx.DirectiveRx<TValue> {
    return this.#chargeRx.rxDirective(rawName, directive => this.addCharge(directive));
  }

}

class OpaqueURICharge$ListRx<in TValue = ChURIPrimitive, out TCharge = unknown>
  extends OpaqueURICharge$ItemsRx<TValue, TCharge>
  implements URIChargeRx.ListRx<TValue, TCharge> {

  endList(): TCharge {
    return this.chargeRx.none;
  }

}

class OpaqueURICharge$DirectiveRx<in TValue = ChURIPrimitive, out TCharge = unknown>
  extends OpaqueURICharge$ItemsRx<TValue, TCharge>
  implements URIChargeRx.DirectiveRx<TValue, TCharge> {

  readonly #rawName: string;

  constructor(chargeRx: URIChargeRx<TValue, TCharge>, rawName: string) {
    super(chargeRx);
    this.#rawName = rawName;
  }

  get rawName(): string {
    return this.#rawName;
  }

  endDirective(): TCharge {
    return this.chargeRx.none;
  }

}
