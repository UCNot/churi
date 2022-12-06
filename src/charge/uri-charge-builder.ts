import { ChURIDirective, ChURIEntity, ChURIPrimitive } from './ch-uri-value.js';
import { URICharge$List, URICharge$Map, URICharge$Single } from './impl/uri-charge.some.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { URIChargeRx } from './uri-charge-rx.js';
import { URICharge, URIChargeItem } from './uri-charge.js';

export class URIChargeBuilder<out TValue = URIChargeItem>
  implements URIChargeRx<TValue, URICharge<TValue>> {

  get none(): URICharge.None {
    return URICharge.none;
  }

  createValue(value: TValue | ChURIPrimitive, type: string): URICharge.Single<TValue> {
    return new URICharge$Single(value, type);
  }

  createEntity(rawEntity: string): URICharge.Single<TValue> {
    return new URICharge$Single<TValue>(new ChURIEntity(rawEntity), 'entity');
  }

  rxValue(
    endValue?: URIChargeRx.End<URICharge<TValue>>,
  ): URIChargeRx.ValueRx<TValue, URICharge<TValue>> {
    return new URIChargeBuilder$ValueRx(this, endValue);
  }

  rxMap(
    endMap?: URIChargeRx.End<URICharge.Map<TValue>>,
  ): URIChargeRx.MapRx<TValue, URICharge<TValue>> {
    return new URIChargeBuilder$MapRx(this, endMap);
  }

  rxList(
    endList?: URIChargeRx.End<URICharge.List<TValue>>,
  ): URIChargeRx.ListRx<TValue, URICharge<TValue>> {
    return new URIChargeBuilder$ListRx(this, endList);
  }

  rxDirective(
    rawName: string,
    endDirective?: URIChargeRx.End<URICharge.Single<TValue>>,
  ): URIChargeRx.DirectiveRx<TValue, URICharge<TValue>> {
    return new URIChargeBuilder$DirectiveRx(this, rawName, endDirective);
  }

}

const URIChargeBuilder$ValueRx = /*#__PURE__*/ OpaqueURIChargeRx.ValueRx;

const OpaqueMapRx = /*#__PURE__*/ OpaqueURIChargeRx.MapRx;

class URIChargeBuilder$MapRx<out TValue = ChURIPrimitive> extends OpaqueMapRx<
  TValue,
  URICharge<TValue>
> {

  readonly #endMap?: URIChargeRx.End<URICharge.Map<TValue>>;
  readonly #map: Map<string, URICharge.Some<TValue>>;

  constructor(
    chargeRx: URIChargeRx<TValue, URICharge<TValue>>,
    endMap?: URIChargeRx.End<URICharge.Map<TValue>>,
    base?: URICharge.Map<TValue>,
  ) {
    super(chargeRx, endMap);
    this.#endMap = endMap;
    this.#map = new Map(base?.entries());
  }

  override putCharge(key: string, charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#map.set(key, charge);
    }
  }

  override startMap(key: string): URIChargeRx.MapRx<TValue> {
    const prevCharge = this.#map.get(key);

    return new URIChargeBuilder$MapRx(
      this.chargeRx,
      map => this.putCharge(key, map),
      prevCharge && prevCharge.isMap() ? prevCharge : undefined,
    );
  }

  override startList(key: string): URIChargeRx.ListRx<TValue, unknown> {
    const prevCharge = this.#map.get(key);

    return new URIChargeBuilder$ListRx(
      this.chargeRx,
      list => this.putCharge(key, list),
      prevCharge,
    );
  }

  endMap(): URICharge.Map<TValue> {
    const map = new URICharge$Map(this.#map);

    this.#endMap?.(map);

    return map;
  }

}

const OpaqueListRx = /*#__PURE__*/ OpaqueURIChargeRx.ListRx;

class URIChargeBuilder$ListRx<out TValue = ChURIPrimitive> extends OpaqueListRx<
  TValue,
  URICharge<TValue>
> {

  readonly #endList?: URIChargeRx.End<URICharge.List<TValue>>;
  readonly #list: URICharge.Some<TValue>[];

  constructor(
    chargeRx: URIChargeRx<TValue, URICharge<TValue>>,
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

  override addCharge(charge: URICharge<TValue>): void {
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

class URIChargeBuilder$DirectiveRx<out TValue = ChURIPrimitive> extends OpaqueDirectiveRx<
  TValue,
  URICharge<TValue>
> {

  readonly #endDirective?: URIChargeRx.End<URICharge.Single<TValue>>;
  #builder: URIChargeDirective$Builder<TValue> = URIChargeDirective$none;

  constructor(
    chargeRx: URIChargeRx<TValue, URICharge<TValue>>,
    rawName: string,
    endDirective?: URIChargeRx.End<URICharge.Single<TValue>>,
  ) {
    super(chargeRx, rawName, endDirective);
    this.#endDirective = endDirective;
  }

  override addCharge(charge: URICharge<TValue>): void {
    if (charge.isSome()) {
      this.#builder = this.#builder.add(charge);
    }
  }

  endDirective(): URICharge.Single<TValue> {
    const directive = new URICharge$Single(this.#builder.build(this.rawName), 'directive');

    this.#endDirective?.(directive);

    return directive;
  }

}

interface URIChargeDirective$Builder<out TValue> {
  add(value: URICharge.Some<TValue>): URIChargeDirective$Builder<TValue>;
  build(rawName: string): ChURIDirective<URICharge<TValue>>;
}

class URIChargeDirective$None<TValue> implements URIChargeDirective$Builder<TValue> {

  add(value: URICharge.Some<TValue>): URIChargeDirective$Single<TValue> {
    return new URIChargeDirective$Single(value);
  }

  build(rawName: string): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, URICharge.none);
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

  build(rawName: string): ChURIDirective<URICharge<TValue>> {
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

  build(rawName: string): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, new URICharge$List(this.#list));
  }

}
