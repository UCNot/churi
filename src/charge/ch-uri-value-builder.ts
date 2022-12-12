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

  static get ValueRx(): ChURIValueBuilder.ValueRx.Constructor {
    return OpaqueURIChargeRx.ValueRx;
  }

  static get MapRx(): ChURIValueBuilder.MapRx.Constructor {
    return ChURIValueBuilder$MapRx;
  }

  static get ListRx(): ChURIValueBuilder.ListRx.Constructor {
    return ChURIValueBuilder$ListRx;
  }

  static get DirectiveRx(): ChURIValueBuilder.DirectiveRx.Constructor {
    return ChURIValueBuilder$DirectiveRx;
  }

  get ns(): ChURIValueBuilder.Namespace {
    return this.constructor as typeof ChURIValueBuilder;
  }

  get none(): ChURIValue<TValue> {
    return null;
  }

  createEntity(rawEntity: string): ChURIValue<TValue> {
    return new ChURIEntity(rawEntity);
  }

  createValue(value: TValue | ChURIPrimitive, _type: string): ChURIValue<TValue> {
    return value;
  }

  rxValue<T>(parse: (rx: URIChargeRx.ValueRx<TValue, ChURIValue<TValue>>) => T): T {
    return parse(new this.ns.ValueRx(this));
  }

  rxMap(
    endMap?: URIChargeRx.End<ChURIMap<TValue>>,
    map?: ChURIMap<TValue>,
  ): ChURIValueBuilder.MapRx<TValue> {
    return new this.ns.MapRx(this, endMap, map);
  }

  rxList(
    endList?: URIChargeRx.End<ChURIList<TValue>>,
    list?: ChURIList<TValue>,
  ): ChURIValueBuilder.ListRx<TValue> {
    return new this.ns.ListRx(this, endList, list);
  }

  rxDirective(
    rawName: string,
    endDirective?: URIChargeRx.End<ChURIDirective<ChURIValue<TValue>>>,
  ): ChURIValueBuilder.DirectiveRx<TValue> {
    return new this.ns.DirectiveRx(this, rawName, endDirective);
  }

}

export namespace ChURIValueBuilder {
  export interface Namespace {
    readonly ValueRx: ValueRx.Constructor;
    readonly MapRx: MapRx.Constructor;
    readonly ListRx: ListRx.Constructor;
    readonly DirectiveRx: DirectiveRx.Constructor;
  }

  export type ValueRx<
    TValue = ChURIPrimitive,
    TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
  > = URIChargeRx.ValueRx<TValue, ChURIValue<TValue>, TRx>;

  export namespace ValueRx {
    export type Constructor = new <
      TValue,
      TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
    >(
      chargeRx: TRx,
    ) => ValueRx<TValue, TRx>;
  }

  export type MapRx<
    TValue = ChURIPrimitive,
    TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
  > = URIChargeRx.MapRx<TValue, ChURIValue<TValue>, TRx>;

  export namespace MapRx {
    export type Constructor = new <
      TValue,
      TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      endMap?: URIChargeRx.End<ChURIMap<TValue>>,
      list?: ChURIMap<TValue>,
    ) => MapRx<TValue, TRx>;
  }

  export type ListRx<
    TValue = ChURIPrimitive,
    TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
  > = URIChargeRx.ListRx<TValue, ChURIValue<TValue>, TRx>;

  export namespace ListRx {
    export type Constructor = new <
      TValue,
      TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      endList?: URIChargeRx.End<ChURIList<TValue>>,
      list?: ChURIList<TValue>,
    ) => ListRx<TValue, TRx>;
  }

  export type DirectiveRx<
    TValue = ChURIPrimitive,
    TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
  > = URIChargeRx.DirectiveRx<TValue, ChURIValue<TValue>, TRx>;

  export namespace DirectiveRx {
    export type Constructor = new <
      TValue,
      TRx extends ChURIValueBuilder<TValue> = ChURIValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      rawName: string,
      endDirective?: URIChargeRx.End<ChURIDirective<ChURIValue<TValue>>>,
    ) => DirectiveRx<TValue, TRx>;
  }
}

const OpaqueMapRx = /*#__PURE__*/ OpaqueURIChargeRx.MapRx;

class ChURIValueBuilder$MapRx<out TValue, out TRx extends ChURIValueBuilder<TValue>>
  extends OpaqueMapRx<TValue, ChURIValue<TValue>, TRx>
  implements ChURIValueBuilder.MapRx<TValue, TRx> {

  readonly #map: ChURIMap<TValue>;
  readonly #endMap?: URIChargeRx.End<ChURIMap<TValue>>;

  constructor(
    chargeRx: TRx,
    endMap?: URIChargeRx.End<ChURIMap<TValue>>,
    map: ChURIMap<TValue> = {},
  ) {
    super(chargeRx, endMap);
    this.#map = map;
    this.#endMap = endMap;
  }

  override put(key: string, charge: ChURIValue<TValue>): void {
    this.#map[key] = charge;
  }

  startMap(key: string): ChURIValueBuilder.MapRx<TValue> {
    return this.chargeRx.rxMap(undefined, this.#addMap(key));
  }

  #addMap(key: string): ChURIMap<TValue> {
    const prevValue = this.#map[key];
    let map: ChURIMap<TValue>;

    if (prevValue && typeof prevValue === 'object' && !Array.isArray(prevValue)) {
      map = prevValue as ChURIMap<TValue>;
    } else {
      this.put(key, (map = {}));
    }

    return map;
  }

  startList(key: string): URIChargeRx.ListRx<TValue> {
    return this.chargeRx.rxList(undefined, this.#addList(key));
  }

  #addList(key: string): ChURIList<TValue> {
    const prevValue = this.#map[key];
    let list: ChURIList<TValue>;

    if (Array.isArray(prevValue)) {
      list = prevValue;
    } else {
      this.put(key, (list = prevValue != null ? [prevValue] : []));
    }

    return list;
  }

  endMap(): ChURIMap<TValue> {
    this.#endMap?.(this.#map);

    return this.#map;
  }

}

const OpaqueListRx = /*#__PURE__*/ OpaqueURIChargeRx.ListRx;

class ChURIValueBuilder$ListRx<out TValue, out TRx extends ChURIValueBuilder<TValue>>
  extends OpaqueListRx<TValue, ChURIValue<TValue>, TRx>
  implements ChURIValueBuilder.ListRx<TValue, TRx> {

  readonly #list: ChURIList<TValue>;
  readonly #endList?: URIChargeRx.End<ChURIList<TValue>>;

  constructor(
    chargeRx: TRx,
    endList?: URIChargeRx.End<ChURIList<TValue>>,
    list: ChURIList<TValue> = [],
  ) {
    super(chargeRx, endList);
    this.#list = list;
    this.#endList = endList;
  }

  override add(charge: ChURIValue<TValue>): void {
    this.#list.push(charge);
  }

  endList(): ChURIList<TValue> {
    this.#endList?.(this.#list);

    return this.#list;
  }

}

const OpaqueDirectiveRx = /*#__PURE__*/ OpaqueURIChargeRx.DirectiveRx;

class ChURIValueBuilder$DirectiveRx<out TValue, out TRx extends ChURIValueBuilder<TValue>>
  extends OpaqueDirectiveRx<TValue, ChURIValue<TValue>, TRx>
  implements ChURIValueBuilder.DirectiveRx<TValue, TRx> {

  readonly #rawName: string;
  readonly #endDirective?: URIChargeRx.End<ChURIDirective<ChURIValue<TValue>>>;
  #value: ChURIDirective$Builder<TValue> = ChURIDirective$none;

  constructor(
    chargeRx: TRx,
    rawName: string,
    endDirective?: URIChargeRx.End<ChURIDirective<ChURIValue<TValue>>>,
  ) {
    super(chargeRx, rawName, endDirective);
    this.#rawName = rawName;
    this.#endDirective = endDirective;
  }

  override add(charge: ChURIValue<TValue>): void {
    this.#value = this.#value.add(charge);
  }

  endDirective(): ChURIDirective<ChURIValue<TValue>> {
    const directive = this.#value.build(this, this.#rawName);

    this.#endDirective?.(directive);

    return directive;
  }

}

interface ChURIDirective$Builder<TValue> {
  add(value: ChURIValue<TValue>): ChURIDirective$Builder<TValue>;
  build(
    rx: URIChargeRx.DirectiveRx<TValue, ChURIValue<TValue>>,
    rawName: string,
  ): ChURIDirective<ChURIValue<TValue>>;
}

class ChURIDirective$None<TValue> implements ChURIDirective$Builder<TValue> {

  add(value: ChURIValue<TValue>): ChURIDirective$Single<TValue> {
    return new ChURIDirective$Single(value);
  }

  build(
    rx: URIChargeRx.DirectiveRx<TValue, ChURIValue<TValue>>,
    rawName: string,
  ): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, rx.chargeRx.none);
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

  build(
    _rx: URIChargeRx.DirectiveRx<TValue, ChURIValue<TValue>>,
    rawName: string,
  ): ChURIDirective<ChURIValue<TValue>> {
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

  build(
    _rx: URIChargeRx.DirectiveRx<TValue, ChURIValue<TValue>>,
    rawName: string,
  ): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, this.#list);
  }

}
