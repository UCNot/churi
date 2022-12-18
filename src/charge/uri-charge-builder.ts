import { URICharge$List, URICharge$Map, URICharge$Single } from './impl/uri-charge.some.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { UcDirective, UcEntity, UcPrimitive } from './uc-value.js';
import { URIChargeRx } from './uri-charge-rx.js';
import { URICharge, URIChargeItem } from './uri-charge.js';

export class URIChargeBuilder<out TValue = UcPrimitive>
  implements URIChargeRx<URIChargeItem<TValue>, URICharge<TValue>> {

  static get ValueRx(): URIChargeBuilder.ValueRx.Constructor {
    return URIChargeBuilder$ValueRx;
  }

  static get MapRx(): URIChargeBuilder.MapRx.Constructor {
    return URIChargeBuilder$MapRx;
  }

  static get ListRx(): URIChargeBuilder.ListRx.Constructor {
    return URIChargeBuilder$ListRx;
  }

  get ns(): URIChargeBuilder.Namespace {
    return this.constructor as typeof URIChargeBuilder;
  }

  get none(): URICharge.None {
    return URICharge.none;
  }

  createEntity(rawEntity: string): URICharge.Single<TValue> {
    return new URICharge$Single<TValue>(new UcEntity(rawEntity), 'entity');
  }

  createValue(value: URIChargeItem<TValue>, type: string): URICharge.Single<TValue> {
    return new URICharge$Single(value, type);
  }

  rxValue(
    parse: (rx: URIChargeBuilder.ValueRx<TValue>) => URICharge<TValue>,
    base?: URICharge.Some<TValue>,
  ): URICharge<TValue> {
    return parse(new this.ns.ValueRx(this, base));
  }

  rxMap(
    parse: (rx: URIChargeBuilder.MapRx<TValue>) => URICharge<TValue>,
    base?: URICharge.Map<TValue>,
  ): URICharge<TValue> {
    return parse(new this.ns.MapRx(this, base));
  }

  rxList(parse: (rx: URIChargeBuilder.ListRx<TValue>) => URICharge<TValue>): URICharge<TValue> {
    return parse(new this.ns.ListRx(this));
  }

  rxDirective(
    rawName: string,
    parse: (rx: URIChargeBuilder.ValueRx<TValue>) => URICharge<TValue>,
  ): URICharge<TValue> {
    return this.rxValue(rx => {
      const value = parse(rx);

      return new URICharge$Single(new UcDirective(rawName, value), 'directive');
    });
  }

}

export namespace URIChargeBuilder {
  export interface Namespace {
    readonly ValueRx: ValueRx.Constructor;
    readonly MapRx: MapRx.Constructor;
    readonly ListRx: ListRx.Constructor;
  }

  export type ValueRx<
    TValue,
    TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
  > = URIChargeRx.ValueRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>;

  export namespace ValueRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      base?: URICharge.Some<TValue>,
    ) => ValueRx<TValue, TRx>;
  }

  export interface MapRx<TValue, TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>>
    extends URIChargeRx.MapRx<URIChargeItem<TValue>, URICharge<TValue>, TRx> {
    endMap(): URICharge.Map<TValue>;
  }

  export namespace MapRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      base?: URICharge.Map<TValue>,
    ) => MapRx<TValue, TRx>;
  }

  export interface ListRx<TValue, TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>>
    extends URIChargeRx.ValueRx<URIChargeItem<TValue>, URICharge<TValue>, TRx> {
    end(): URICharge.List<TValue>;
  }

  export namespace ListRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
    ) => ListRx<TValue, TRx>;
  }
}

const OpaqueValueRx = /*#__PURE__*/ OpaqueURIChargeRx.ValueRx;

class URIChargeBuilder$ValueRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueValueRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>
  implements URIChargeBuilder.ValueRx<TValue, TRx> {

  readonly #base: URICharge.Some<TValue> | undefined;
  #builder: URIChargeValue$Builder<TValue> = URIChargeValue$none;

  constructor(chargeRx: TRx, base?: URICharge.Some<TValue>) {
    super(chargeRx);
    this.#base = base;
  }

  override add(charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#builder = this.#builder.add(charge);
    }
  }

  override rxMap(
    parse: (
      rx: URIChargeRx.MapRx<
        URIChargeItem<TValue>,
        URICharge<TValue>,
        URIChargeRx<URIChargeItem<TValue>, URICharge<TValue>>
      >,
    ) => URICharge<TValue>,
  ): void {
    if (this.#base?.isMap()) {
      this.add(this.chargeRx.rxMap(parse, this.#base));
    } else {
      super.rxMap(parse);
    }
  }

  override end(): URICharge<TValue> {
    return this.#builder.build(this);
  }

}

interface URIChargeValue$Builder<out TValue> {
  add(value: URICharge.Some<TValue>): URIChargeValue$Builder<TValue>;
  build(rx: URIChargeBuilder.ValueRx<TValue>): URICharge<TValue>;
}

class URIChargeValue$None<TValue> implements URIChargeValue$Builder<TValue> {

  add(value: URICharge.Some<TValue>): URIChargeValue$Single<TValue> {
    return new URIChargeValue$Single(value);
  }

  build(rx: URIChargeBuilder.ValueRx<TValue>): URICharge<TValue> {
    return rx.chargeRx.none;
  }

}

const URIChargeValue$none: URIChargeValue$Builder<any> = /*#__PURE__*/ new URIChargeValue$None();

class URIChargeValue$Single<TValue> implements URIChargeValue$Builder<TValue> {

  readonly #value: URICharge.Some<TValue>;

  constructor(value: URICharge.Some<TValue>) {
    this.#value = value;
  }

  add(value: URICharge.Some<TValue>): URIChargeValue$List<TValue> {
    return new URIChargeValue$List([this.#value, value]);
  }

  build(_rx: URIChargeBuilder.ValueRx<TValue>): URICharge<TValue> {
    return this.#value;
  }

}

class URIChargeValue$List<TValue> implements URIChargeValue$Builder<TValue> {

  readonly #list: URICharge.Some<TValue>[];

  constructor(list: URICharge.Some<TValue>[]) {
    this.#list = list;
  }

  add(value: URICharge.Some<TValue>): this {
    this.#list.push(value);

    return this;
  }

  build(_rx: URIChargeBuilder.ValueRx<TValue>): URICharge<TValue> {
    return new URICharge$List(this.#list);
  }

}

const OpaqueMapRx = /*#__PURE__*/ OpaqueURIChargeRx.MapRx;

class URIChargeBuilder$MapRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueMapRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>
  implements URIChargeBuilder.MapRx<TValue, TRx> {

  readonly #map: Map<string, URICharge.Some<TValue>>;

  constructor(chargeRx: TRx, base?: URICharge.Map<TValue>) {
    super(chargeRx);
    this.#map = new Map(base?.entries());
  }

  override rxEntry(
    key: string,
    parse: (rx: URIChargeBuilder.ValueRx<TValue>) => URICharge<TValue>,
  ): void {
    const map = this.chargeRx.rxValue(parse, this.#map.get(key));

    if (map.isSome()) {
      this.#map.set(key, map);
    }
  }

  override endMap(): URICharge.Map<TValue> {
    return new URICharge$Map(this.#map);
  }

}

class URIChargeBuilder$ListRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueValueRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>
  implements URIChargeBuilder.ValueRx<TValue, TRx> {

  readonly #list: URICharge.Some<TValue>[] = [];

  override add(charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#list.push(charge);
    }
  }

  override end(): URICharge.List<TValue> {
    return new URICharge$List(this.#list);
  }

}
