import { ChURIPrimitive } from './ch-uri-value.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class OpaqueURIChargeRx<out TValue = ChURIPrimitive, out TCharge = unknown>
  implements URIChargeRx<TValue, TCharge> {

  static #listRx?: URIChargeRx.ListRx.Constructor;
  static #directiveRx?: URIChargeRx.DirectiveRx.Constructor;

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
    if (this.#listRx) {
      return this.#listRx;
    }

    class OpaqueURICharge$ListRx<
        out TValue,
        out TCharge,
        out TRx extends URIChargeRx<TValue, TCharge>,
      >
      extends this.ItemsRx<TValue, TCharge, TRx>
      implements URIChargeRx.ListRx<TValue, TCharge, TRx> {

      readonly #endList: URIChargeRx.End<TCharge> | undefined;

      constructor(chargeRx: TRx, endList?: URIChargeRx.End<TCharge>) {
        super(chargeRx);
        this.#endList = endList;
      }

      endList(): TCharge {
        const { none } = this.chargeRx;

        this.#endList?.(none);

        return none;
      }

}

    return (this.#listRx = OpaqueURICharge$ListRx);
  }

  static get DirectiveRx(): URIChargeRx.DirectiveRx.Constructor {
    if (this.#directiveRx) {
      return this.#directiveRx;
    }

    class OpaqueURICharge$DirectiveRx<
        out TValue,
        out TCharge,
        out TRx extends URIChargeRx<TValue, TCharge>,
      >
      extends this.ItemsRx<TValue, TCharge, TRx>
      implements URIChargeRx.DirectiveRx<TValue, TCharge, TRx> {

      readonly #rawName: string;
      readonly #endDirective: URIChargeRx.End<TCharge> | undefined;

      constructor(chargeRx: TRx, rawName: string, endDirective?: URIChargeRx.End<TCharge>) {
        super(chargeRx);
        this.#rawName = rawName;
        this.#endDirective = endDirective;
      }

      get rawName(): string {
        return this.#rawName;
      }

      endDirective(): TCharge {
        const { none } = this.chargeRx;

        this.#endDirective?.(none);

        return none;
      }

}

    return (this.#directiveRx = OpaqueURICharge$DirectiveRx);
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

  createValue(_value: TValue | ChURIPrimitive, _type: string): TCharge {
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

class OpaqueURICharge$ValueRx<out TValue, out TCharge, out TRx extends URIChargeRx<TValue, TCharge>>
  implements URIChargeRx.ValueRx<TValue, TCharge, TRx> {

  readonly #chargeRx: TRx;
  readonly #passCharge: <TResult extends TCharge>(this: void, charge: TResult) => TCharge;

  constructor(chargeRx: TRx, endCharge?: URIChargeRx.End<TCharge>) {
    this.#chargeRx = chargeRx;
    this.#passCharge = endCharge ? charge => (endCharge(charge), charge) : charge => charge;
  }

  get chargeRx(): TRx {
    return this.#chargeRx;
  }

  set(charge: TCharge): TCharge {
    return this.#passCharge(charge);
  }

  setEntity(rawEntity: string): TCharge {
    return this.set(this.#chargeRx.createEntity(rawEntity));
  }

  setValue(value: ChURIPrimitive | TValue, type: string): TCharge {
    return this.set(this.#chargeRx.createValue(value, type));
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

class OpaqueURICharge$MapRx<out TValue, out TCharge, out TRx extends URIChargeRx<TValue, TCharge>>
  implements URIChargeRx.MapRx<TValue, TCharge, TRx> {

  readonly #chargeRx: TRx;
  readonly #endMap: URIChargeRx.End<TCharge> | undefined;

  constructor(chargeRx: TRx, endMap?: URIChargeRx.End<TCharge>) {
    this.#chargeRx = chargeRx;
    this.#endMap = endMap;
  }

  get chargeRx(): TRx {
    return this.#chargeRx;
  }

  put(_key: string, _charge: TCharge): void {
    // Ignore entity charge
  }

  putEntity(key: string, rawEntity: string): void {
    this.put(key, this.#chargeRx.createEntity(rawEntity));
  }

  putValue(key: string, value: ChURIPrimitive | TValue, type: string): void {
    this.put(key, this.#chargeRx.createValue(value, type));
  }

  startMap(key: string): URIChargeRx.MapRx<TValue> {
    return this.#chargeRx.rxMap(map => this.put(key, map));
  }

  startList(key: string): URIChargeRx.ListRx<TValue> {
    return this.#chargeRx.rxList(list => this.put(key, list));
  }

  startDirective(key: string, rawName: string): URIChargeRx.DirectiveRx<TValue> {
    return this.#chargeRx.rxDirective(rawName, directive => this.put(key, directive));
  }

  addSuffix(suffix: string): void {
    this.startMap(suffix).endMap();
  }

  endMap(): TCharge {
    const { none } = this.#chargeRx;

    this.#endMap?.(none);

    return none;
  }

}

abstract class OpaqueURICharge$ItemsRx<
  out TValue,
  out TCharge,
  out TRx extends URIChargeRx<TValue, TCharge>,
> implements URIChargeRx.ItemsRx<TValue, TCharge, TRx> {

  readonly #chargeRx: TRx;

  constructor(chargeRx: TRx) {
    this.#chargeRx = chargeRx;
  }

  get chargeRx(): TRx {
    return this.#chargeRx;
  }

  add(_charge: TCharge): void {
    // Ignore item charge
  }

  addEntity(rawEntity: string): void {
    this.add(this.#chargeRx.createEntity(rawEntity));
  }

  addValue(value: ChURIPrimitive | TValue, type: string): void {
    this.add(this.#chargeRx.createValue(value, type));
  }

  startMap(): URIChargeRx.MapRx<TValue> {
    return this.#chargeRx.rxMap(map => this.add(map));
  }

  startList(): URIChargeRx.ListRx<TValue> {
    return this.#chargeRx.rxList(list => this.add(list));
  }

  startDirective(rawName: string): URIChargeRx.DirectiveRx<TValue> {
    return this.#chargeRx.rxDirective(rawName, directive => this.add(directive));
  }

}
