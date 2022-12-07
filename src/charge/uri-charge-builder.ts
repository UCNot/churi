import { ChURIDirective, ChURIEntity, ChURIPrimitive } from './ch-uri-value.js';
import { URICharge$List, URICharge$Map, URICharge$Single } from './impl/uri-charge.some.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { URIChargeRx } from './uri-charge-rx.js';
import { URICharge, URIChargeItem } from './uri-charge.js';

export class URIChargeBuilder<out TValue = URIChargeItem>
  implements URIChargeRx<TValue, URICharge<TValue>> {

  static get ValueRx(): URIChargeBuilder.ValueRx.Constructor {
    return OpaqueURIChargeRx.ValueRx as unknown as URIChargeBuilder.ValueRx.Constructor;
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
    return new URICharge$Single<TValue>(new ChURIEntity(rawEntity), 'entity');
  }

  createValue(value: TValue | ChURIPrimitive, type: string): URICharge.Single<TValue> {
    return new URICharge$Single(value, type);
  }

  rxValue(
    endValue?: URIChargeRx.End<URICharge<TValue>>,
  ): URIChargeRx.ValueRx<TValue, URICharge<TValue>> {
    return new this.ns.ValueRx(this, endValue);
  }

  rxMap(
    endMap?: URIChargeRx.End<URICharge.Map<TValue>>,
    map?: URICharge.Map<TValue>,
  ): URIChargeRx.MapRx<TValue, URICharge<TValue>> {
    return new this.ns.MapRx(this, endMap, map);
  }

  rxList(
    endList?: URIChargeRx.End<URICharge.List<TValue>>,
  ): URIChargeRx.ListRx<TValue, URICharge<TValue>> {
    return new this.ns.ListRx(this, endList);
  }

  rxDirective(
    rawName: string,
    endDirective?: URIChargeRx.End<URICharge.Single<TValue>>,
  ): URIChargeRx.DirectiveRx<TValue, URICharge<TValue>> {
    return new this.ns.DirectiveRx(this, rawName, endDirective);
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
  > = URIChargeRx.ValueRx<TValue, URICharge<TValue>, TRx>;

  export namespace ValueRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      endValue?: URIChargeRx.End<URICharge<TValue>>,
    ) => ValueRx<TValue, TRx>;
  }

  export type MapRx<
    TValue,
    TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
  > = URIChargeRx.MapRx<TValue, URICharge<TValue>, TRx>;

  export namespace MapRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      endMap?: URIChargeRx.End<URICharge.Map<TValue>>,
      map?: URICharge.Map<TValue>,
    ) => MapRx<TValue, TRx>;
  }

  export type ListRx<
    TValue,
    TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
  > = URIChargeRx.ListRx<TValue, URICharge<TValue>, TRx>;

  export namespace ListRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      endList?: URIChargeRx.End<URICharge.List<TValue>>,
      base?: URICharge.Some<TValue>,
    ) => ListRx<TValue, TRx>;
  }

  export type DirectiveRx<
    TValue,
    TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
  > = URIChargeRx.DirectiveRx<TValue, URICharge<TValue>, TRx>;

  export namespace DirectiveRx {
    export type Constructor = new <
      TValue,
      TRx extends URIChargeBuilder<TValue> = URIChargeBuilder<TValue>,
    >(
      chargeRx: TRx,
      rawName: string,
      endDirective?: URIChargeRx.End<URICharge.Single<TValue>>,
    ) => DirectiveRx<TValue, TRx>;
  }
}

const OpaqueMapRx = /*#__PURE__*/ OpaqueURIChargeRx.MapRx;

class URIChargeBuilder$MapRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueMapRx<TValue, URICharge<TValue>, TRx>
  implements URIChargeBuilder.MapRx<TValue, TRx> {

  readonly #endMap?: URIChargeRx.End<URICharge.Map<TValue>>;
  readonly #map: Map<string, URICharge.Some<TValue>>;

  constructor(
    chargeRx: TRx,
    endMap?: URIChargeRx.End<URICharge.Map<TValue>>,
    base?: URICharge.Map<TValue>,
  ) {
    super(chargeRx, endMap);
    this.#endMap = endMap;
    this.#map = new Map(base?.entries());
  }

  override put(key: string, charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#map.set(key, charge);
    }
  }

  override startMap(key: string): URIChargeRx.MapRx<TValue> {
    const prevCharge = this.#map.get(key);

    return new URIChargeBuilder$MapRx(
      this.chargeRx,
      map => this.put(key, map),
      prevCharge && prevCharge.isMap() ? prevCharge : undefined,
    );
  }

  override startList(key: string): URIChargeRx.ListRx<TValue, unknown> {
    const prevCharge = this.#map.get(key);

    return new URIChargeBuilder$ListRx(this.chargeRx, list => this.put(key, list), prevCharge);
  }

  endMap(): URICharge.Map<TValue> {
    const map = new URICharge$Map(this.#map);

    this.#endMap?.(map);

    return map;
  }

}

const OpaqueListRx = /*#__PURE__*/ OpaqueURIChargeRx.ListRx;

class URIChargeBuilder$ListRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueListRx<TValue, URICharge<TValue>, TRx>
  implements URIChargeBuilder.ListRx<TValue, TRx> {

  readonly #endList?: URIChargeRx.End<URICharge.List<TValue>>;
  readonly #list: URICharge.Some<TValue>[];

  constructor(
    chargeRx: TRx,
    endList?: URIChargeRx.End<URICharge.List<TValue>>,
    base?: URICharge.Some<TValue>,
  ) {
    super(chargeRx, endList);
    this.#endList = endList;
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

  override endList(): URICharge.List<TValue> {
    const list = new URICharge$List(this.#list);

    this.#endList?.(list);

    return list;
  }

}

const OpaqueDirectiveRx = /*#__PURE__*/ OpaqueURIChargeRx.DirectiveRx;

class URIChargeBuilder$DirectiveRx<out TValue, out TRx extends URIChargeBuilder<TValue>>
  extends OpaqueDirectiveRx<TValue, URICharge<TValue>, TRx>
  implements URIChargeBuilder.DirectiveRx<TValue, TRx> {

  readonly #endDirective?: URIChargeRx.End<URICharge.Single<TValue>>;
  #builder: URIChargeDirective$Builder<TValue> = URIChargeDirective$none;

  constructor(
    chargeRx: TRx,
    rawName: string,
    endDirective?: URIChargeRx.End<URICharge.Single<TValue>>,
  ) {
    super(chargeRx, rawName, endDirective);
    this.#endDirective = endDirective;
  }

  override add(charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#builder = this.#builder.add(charge);
    }
  }

  endDirective(): URICharge.Single<TValue> {
    const directive = new URICharge$Single(this.#builder.build(this, this.rawName), 'directive');

    this.#endDirective?.(directive);

    return directive;
  }

}

interface URIChargeDirective$Builder<out TValue> {
  add(value: URICharge.Some<TValue>): URIChargeDirective$Builder<TValue>;
  build(
    rx: URIChargeRx.DirectiveRx<TValue, URICharge<TValue>>,
    rawName: string,
  ): ChURIDirective<URICharge<TValue>>;
}

class URIChargeDirective$None<TValue> implements URIChargeDirective$Builder<TValue> {

  add(value: URICharge.Some<TValue>): URIChargeDirective$Single<TValue> {
    return new URIChargeDirective$Single(value);
  }

  build(
    rx: URIChargeRx.DirectiveRx<TValue, URICharge<TValue>>,
    rawName: string,
  ): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, rx.chargeRx.none);
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
    _rx: URIChargeRx.DirectiveRx<TValue, URICharge<TValue>>,
    rawName: string,
  ): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, this.#value);
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
    _rx: URIChargeRx.DirectiveRx<TValue, URICharge<TValue>>,
    rawName: string,
  ): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, new URICharge$List(this.#list));
  }

}
