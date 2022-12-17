import { UcPrimitive } from './uc-value.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class OpaqueURIChargeRx<out TValue = UcPrimitive, out TCharge = unknown>
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

      endList(): TCharge {
        return this.chargeRx.none;
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

      constructor(chargeRx: TRx, rawName: string) {
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

  createValue(_value: TValue | UcPrimitive, _type: string): TCharge {
    return this.none;
  }

  rxValue(parse: (rx: URIChargeRx.ValueRx<TValue, TCharge>) => TCharge): TCharge {
    return parse(new this.ns.ValueRx(this));
  }

  rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): TCharge {
    return parse(new this.ns.MapRx(this));
  }

  rxList(parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): TCharge {
    return parse(new this.ns.ListRx(this));
  }

  rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): TCharge {
    return parse(new this.ns.DirectiveRx(this, rawName));
  }

  rxArgs(
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge, URIChargeRx<TValue, TCharge>>) => TCharge,
  ): TCharge {
    return this.rxDirective('', parse);
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
    this.chargeRx.rxMap(rx => {
      const map = parse(rx);

      this.add(map);

      return map;
    });
  }

  rxList(parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): void {
    this.chargeRx.rxList(rx => {
      const list = parse(rx);

      this.add(list);

      return list;
    });
  }

  rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): void {
    this.#chargeRx.rxDirective(rawName, rx => {
      const directive = parse(rx);

      this.add(directive);

      return directive;
    });
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
    this.#chargeRx.rxMap(rx => {
      const map = parse(rx);

      this.put(key, map);

      return map;
    });
  }

  rxList(key: string, parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): void {
    this.#chargeRx.rxList(rx => {
      const list = parse(rx);

      this.put(key, list);

      return list;
    });
  }

  rxDirective(
    key: string,
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): void {
    this.#chargeRx.rxDirective(rawName, rx => {
      const directive = parse(rx);

      this.put(key, directive);

      return directive;
    });
  }

  addSuffix(suffix: string): void {
    this.putValue(suffix, '', 'string');
  }

  endMap(): TCharge {
    return this.#chargeRx.none;
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
    // Ignore item charge.
  }

  addEntity(rawEntity: string): void {
    this.add(this.#chargeRx.createEntity(rawEntity));
  }

  addValue(value: UcPrimitive | TValue, type: string): void {
    this.add(this.#chargeRx.createValue(value, type));
  }

  rxMap(parse: (rx: URIChargeRx.MapRx<TValue, TCharge>) => TCharge): void {
    this.#chargeRx.rxMap(rx => {
      const charge = parse(rx);

      this.add(charge);

      return charge;
    });
  }

  rxList(parse: (rx: URIChargeRx.ListRx<TValue, TCharge>) => TCharge): void {
    this.#chargeRx.rxList(rx => {
      const list = parse(rx);

      this.add(list);

      return list;
    });
  }

  rxDirective(
    rawName: string,
    parse: (rx: URIChargeRx.DirectiveRx<TValue, TCharge>) => TCharge,
  ): void {
    this.#chargeRx.rxDirective(rawName, rx => {
      const directive = parse(rx);

      this.add(directive);

      return directive;
    });
  }

}
