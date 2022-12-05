import {
  ChURIDirective,
  ChURIEntity,
  ChURIList,
  ChURIMap,
  ChURIPrimitive,
  ChURIValue,
} from './ch-uri-value.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class ChURIValueBuilder<out TValue = ChURIPrimitive>
  implements URIChargeRx<TValue, ChURIValue<TValue>> {

  get none(): ChURIValue<TValue> {
    return null;
  }

  createValue(value: TValue | ChURIPrimitive, _type: string): ChURIValue<TValue> {
    return value;
  }

  createEntity(rawEntity: string): ChURIValue<TValue> {
    return new ChURIEntity(rawEntity);
  }

  rxValue(
    endValue?: URIChargeRx.End<ChURIValue<TValue>>,
  ): URIChargeRx.ValueRx<TValue, ChURIValue<TValue>> {
    return new ChURIValueBuilder$ValueRx(this, endValue);
  }

  rxMap(endMap?: URIChargeRx.End<ChURIMap<TValue>>): URIChargeRx.MapRx<TValue, ChURIValue<TValue>> {
    return new ChURIValueBuilder$MapRx(this, endMap);
  }

  rxList(
    endList?: URIChargeRx.End<ChURIList<TValue>>,
  ): URIChargeRx.ListRx<TValue, ChURIValue<TValue>> {
    return new ChURIValueBuilder$ListRx(this, endList);
  }

  rxDirective(
    rawName: string,
    endDirective?: URIChargeRx.End<ChURIDirective<ChURIValue<TValue>>>,
  ): URIChargeRx.DirectiveRx<TValue, ChURIValue<TValue>> {
    return new ChURIValueBuilder$DirectiveRx(this, rawName, endDirective);
  }

}

const ChURIValueBuilder$ValueRx = /*#__PURE__*/ OpaqueURIChargeRx.ValueRx;

const OpaqueMapRx = /*#__PURE__*/ OpaqueURIChargeRx.MapRx;

class ChURIValueBuilder$MapRx<out TValue = ChURIPrimitive> extends OpaqueMapRx<
  TValue,
  ChURIValue<TValue>
> {

  readonly #map: ChURIMap<TValue>;
  readonly #endMap?: URIChargeRx.End<ChURIMap<TValue>>;

  constructor(
    chargeRx: URIChargeRx<TValue, ChURIValue<TValue>>,
    endMap?: URIChargeRx.End<ChURIMap<TValue>>,
    map: ChURIMap<TValue> = {},
  ) {
    super(chargeRx, endMap);
    this.#map = map;
    this.#endMap = endMap;
  }

  override putCharge(key: string, charge: ChURIValue<TValue>): void {
    this.#map[key] = charge;
  }

  startMap(key: string): URIChargeRx.MapRx<TValue> {
    return new ChURIValueBuilder$MapRx(this.chargeRx, undefined, this.#addMap(key));
  }

  #addMap(key: string): ChURIMap<TValue> {
    const prevValue = this.#map[key];
    let map: ChURIMap<TValue>;

    if (prevValue && typeof prevValue === 'object' && !Array.isArray(prevValue)) {
      map = prevValue as ChURIMap<TValue>;
    } else {
      this.putCharge(key, (map = {}));
    }

    return map;
  }

  startList(key: string): URIChargeRx.ListRx<TValue> {
    return new ChURIValueBuilder$ListRx(this.chargeRx, undefined, this.#addList(key));
  }

  #addList(key: string): ChURIList<TValue> {
    const prevValue = this.#map[key];
    let list: ChURIList<TValue>;

    if (Array.isArray(prevValue)) {
      list = prevValue;
    } else {
      this.putCharge(key, (list = prevValue != null ? [prevValue] : []));
    }

    return list;
  }

  endMap(): ChURIMap<TValue> {
    this.#endMap?.(this.#map);

    return this.#map;
  }

}

const OpaqueListRx = /*#__PURE__*/ OpaqueURIChargeRx.ListRx;

class ChURIValueBuilder$ListRx<out TValue = ChURIPrimitive> extends OpaqueListRx<
  TValue,
  ChURIValue<TValue>
> {

  readonly #list: ChURIList<TValue>;
  readonly #endList?: URIChargeRx.End<ChURIList<TValue>>;

  constructor(
    chargeRx: URIChargeRx<TValue, ChURIValue<TValue>>,
    endList?: URIChargeRx.End<ChURIList<TValue>>,
    list: ChURIList<TValue> = [],
  ) {
    super(chargeRx, endList);
    this.#list = list;
    this.#endList = endList;
  }

  override addCharge(charge: ChURIValue<TValue>): void {
    this.#list.push(charge);
  }

  endList(): ChURIList<TValue> {
    this.#endList?.(this.#list);

    return this.#list;
  }

}

const OpaqueDirectiveRx = /*#__PURE__*/ OpaqueURIChargeRx.DirectiveRx;

class ChURIValueBuilder$DirectiveRx<out TValue = ChURIPrimitive> extends OpaqueDirectiveRx<
  TValue,
  ChURIValue<TValue>
> {

  readonly #rawName: string;
  readonly #endDirective?: URIChargeRx.End<ChURIDirective<ChURIValue<TValue>>>;
  #value: ChURIDirective$Builder<TValue> = ChURIDirective$none;

  constructor(
    chargeRx: URIChargeRx<TValue, ChURIValue<TValue>>,
    rawName: string,
    endDirective?: URIChargeRx.End<ChURIDirective<ChURIValue<TValue>>>,
  ) {
    super(chargeRx, rawName, endDirective);
    this.#rawName = rawName;
    this.#endDirective = endDirective;
  }

  override addCharge(charge: ChURIValue<TValue>): void {
    this.#value = this.#value.add(charge);
  }

  endDirective(): ChURIDirective<ChURIValue<TValue>> {
    const directive = this.#value.build(this.#rawName);

    this.#endDirective?.(directive);

    return directive;
  }

}

interface ChURIDirective$Builder<TValue> {
  add(value: ChURIValue<TValue>): ChURIDirective$Builder<TValue>;
  build(rawName: string): ChURIDirective<ChURIValue<TValue>>;
}

class ChURIDirective$None<TValue> implements ChURIDirective$Builder<TValue> {

  add(value: ChURIValue<TValue>): ChURIDirective$Single<TValue> {
    return new ChURIDirective$Single(value);
  }

  build(rawName: string): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, {});
  }

}

const ChURIDirective$none: ChURIDirective$Builder<any> = /*#__PURE__*/ new ChURIDirective$None();

class ChURIDirective$Single<TValue> implements ChURIDirective$Builder<TValue> {

  readonly #value: ChURIValue<TValue>;

  constructor(value: ChURIValue<TValue>) {
    this.#value = value;
  }

  add(value: ChURIValue<TValue>): ChURIDirective$List<TValue> {
    return new ChURIDirective$List([this.#value, value]);
  }

  build(rawName: string): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, this.#value);
  }

}

class ChURIDirective$List<TValue> implements ChURIDirective$Builder<TValue> {

  readonly #list: ChURIList<TValue>;

  constructor(list: ChURIList<TValue>) {
    this.#list = list;
  }

  add(value: ChURIValue<TValue>): this {
    this.#list.push(value);

    return this;
  }

  build(rawName: string): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, this.#list);
  }

}
