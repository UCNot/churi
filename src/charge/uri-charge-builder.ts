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

  static get DirectiveRx(): URIChargeBuilder.DirectiveRx.Constructor {
    return URIChargeBuilder$DirectiveRx;
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

  rxValue(parse: (rx: URIChargeBuilder.ValueRx<TValue>) => URICharge<TValue>): URICharge<TValue> {
    return parse(new this.ns.ValueRx(this));
  }

  rxMap(
    parse: (rx: URIChargeBuilder.MapRx<TValue>) => URICharge<TValue>,
    base?: URICharge.Map<TValue>,
  ): URICharge<TValue> {
    return parse(new this.ns.MapRx(this, base));
  }

  rxList(
    parse: (rx: URIChargeBuilder.ListRx<TValue>) => URICharge<TValue>,
    base?: URICharge.Some<TValue>,
  ): URICharge<TValue> {
    return parse(new this.ns.ListRx(this, base));
  }

  rxDirective(
    rawName: string,
    parse: (rx: URIChargeBuilder.DirectiveRx<TValue>) => URICharge<TValue>,
  ): URICharge<TValue> {
    return parse(new this.ns.DirectiveRx(this, rawName));
  }

}

export namespace URIChargeBuilder {
  export interface Namespace {
    readonly ValueRx: ValueRx.Constructor;
    readonly MapRx: MapRx.Constructor;
    readonly ListRx: ListRx.Constructor;
    readonly DirectiveRx: DirectiveRx.Constructor;
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
    ) => ValueRx<TValue, TRx>;
  }

  export type MapRx<
    TValue,
    TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
  > = URIChargeRx.MapRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>;

  export namespace MapRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      base?: URICharge.Map<TValue>,
    ) => MapRx<TValue, TRx>;
  }

  export type ListRx<
    TValue,
    TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
  > = URIChargeRx.ListRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>;

  export namespace ListRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      base?: URICharge.Some<TValue>,
    ) => ListRx<TValue, TRx>;
  }

  export type DirectiveRx<
    TValue,
    TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
  > = URIChargeRx.DirectiveRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>;

  export namespace DirectiveRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      rawName: string,
    ) => DirectiveRx<TValue, TRx>;
  }
}

const OpaqueValueRx = /*#__PURE__*/ OpaqueURIChargeRx.ValueRx;

class URIChargeBuilder$ValueRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueValueRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>
  implements URIChargeBuilder.ValueRx<TValue, TRx> {

  #builder: URIChargeValue$Builder<TValue> = URIChargeValue$none;

  override add(charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#builder = this.#builder.add(charge);
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

  override put(key: string, charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#map.set(key, charge);
    }
  }

  override rxMap(
    key: string,
    parse: (rx: URIChargeBuilder.MapRx<TValue>) => URICharge<TValue>,
  ): void {
    const prevCharge = this.#map.get(key);

    this.chargeRx.rxMap(
      rx => {
        const map = parse(rx);

        this.put(key, map);

        return map;
      },

      prevCharge && prevCharge.isMap() ? prevCharge : undefined,
    );
  }

  override rxList(
    key: string,
    parse: (rx: URIChargeBuilder.ListRx<TValue>) => URICharge<TValue>,
  ): void {
    const prevCharge = this.#map.get(key);

    this.chargeRx.rxList(rx => {
      const list = parse(rx);

      this.put(key, list);

      return list;
    }, prevCharge);
  }

  override endMap(): URICharge.Map<TValue> {
    return new URICharge$Map(this.#map);
  }

}

const OpaqueListRx = /*#__PURE__*/ OpaqueURIChargeRx.ListRx;

class URIChargeBuilder$ListRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueListRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>
  implements URIChargeBuilder.ListRx<TValue, TRx> {

  readonly #list: URICharge.Some<TValue>[];

  constructor(chargeRx: TRx, base?: URICharge.Some<TValue>) {
    super(chargeRx);
    if (base?.isList()) {
      this.#list = [...base.list()];
    } else if (base) {
      this.#list = [base];
    } else {
      this.#list = [];
    }
  }

  override add(charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#list.push(charge);
    }
  }

  override end(): URICharge.List<TValue> {
    return new URICharge$List(this.#list);
  }

}

const OpaqueDirectiveRx = /*#__PURE__*/ OpaqueURIChargeRx.DirectiveRx;

class URIChargeBuilder$DirectiveRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueDirectiveRx<URIChargeItem<TValue>, URICharge<TValue>, TRx>
  implements URIChargeBuilder.DirectiveRx<TValue, TRx> {

  #builder: URIChargeDirective$Builder<TValue> = URIChargeDirective$none;

  override add(charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#builder = this.#builder.add(charge);
    }
  }

  override end(): URICharge<TValue> {
    return new URICharge$Single(this.#builder.build(this, this.rawName), 'directive');
  }

}

interface URIChargeDirective$Builder<out TValue> {
  add(value: URICharge.Some<TValue>): URIChargeDirective$Builder<TValue>;
  build(rx: URIChargeBuilder.DirectiveRx<TValue>, rawName: string): UcDirective<URICharge<TValue>>;
}

class URIChargeDirective$None<TValue> implements URIChargeDirective$Builder<TValue> {

  add(value: URICharge.Some<TValue>): URIChargeDirective$Single<TValue> {
    return new URIChargeDirective$Single(value);
  }

  build(rx: URIChargeBuilder.DirectiveRx<TValue>, rawName: string): UcDirective<URICharge<TValue>> {
    return new UcDirective(rawName, rx.chargeRx.none);
  }

}

const URIChargeDirective$none: URIChargeDirective$Builder<any> =
  /*#__PURE__*/ new URIChargeDirective$None();

class URIChargeDirective$Single<TValue> implements URIChargeDirective$Builder<TValue> {

  readonly #value: URICharge.Some<TValue>;

  constructor(value: URICharge.Some<TValue>) {
    this.#value = value;
  }

  add(value: URICharge.Some<TValue>): URIChargeDirective$List<TValue> {
    return new URIChargeDirective$List([this.#value, value]);
  }

  build(
    _rx: URIChargeBuilder.DirectiveRx<TValue>,
    rawName: string,
  ): UcDirective<URICharge<TValue>> {
    return new UcDirective(rawName, this.#value);
  }

}

class URIChargeDirective$List<TValue> implements URIChargeDirective$Builder<TValue> {

  readonly #list: URICharge.Some<TValue>[];

  constructor(list: URICharge.Some<TValue>[]) {
    this.#list = list;
  }

  add(value: URICharge.Some<TValue>): this {
    this.#list.push(value);

    return this;
  }

  build(
    _rx: URIChargeBuilder.DirectiveRx<TValue>,
    rawName: string,
  ): UcDirective<URICharge<TValue>> {
    return new UcDirective(rawName, new URICharge$List(this.#list));
  }

}
