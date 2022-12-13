import {
  ChURIDirective,
  ChURIEntity,
  ChURIList,
  ChURIMap,
  ChURIPrimitive,
  ChURIValue,
} from './churi-value.js';
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

  rxValue(
    parse: (rx: ChURIValueBuilder.ValueRx<TValue>) => ChURIValue<TValue>,
  ): ChURIValue<TValue> {
    return parse(new this.ns.ValueRx(this));
  }

  rxMap(
    parse: (rx: ChURIValueBuilder.MapRx<TValue>) => ChURIValue<TValue>,
    map?: ChURIMap<TValue>,
  ): ChURIValue<TValue> {
    return parse(new this.ns.MapRx(this, map));
  }

  rxList(
    parse: (rx: ChURIValueBuilder.ListRx<TValue>) => ChURIValue<TValue>,
    list?: ChURIList<TValue>,
  ): ChURIValue<TValue> {
    return parse(new this.ns.ListRx(this, list));
  }

  rxDirective(
    rawName: string,
    parse: (rx: ChURIValueBuilder.DirectiveRx<TValue>) => ChURIValue<TValue>,
  ): ChURIValue<TValue> {
    return parse(new this.ns.DirectiveRx(this, rawName));
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
      map?: ChURIMap<TValue>,
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
    ) => DirectiveRx<TValue, TRx>;
  }
}

const OpaqueMapRx = /*#__PURE__*/ OpaqueURIChargeRx.MapRx;

class ChURIValueBuilder$MapRx<out TValue, out TRx extends ChURIValueBuilder<TValue>>
  extends OpaqueMapRx<TValue, ChURIValue<TValue>, TRx>
  implements ChURIValueBuilder.MapRx<TValue, TRx> {

  readonly #map: ChURIMap<TValue>;

  constructor(chargeRx: TRx, map: ChURIMap<TValue> = {}) {
    super(chargeRx);
    this.#map = map;
  }

  override put(key: string, charge: ChURIValue<TValue>): void {
    this.#map[key] = charge;
  }

  override rxMap(
    key: string,
    parse: (rx: ChURIValueBuilder.MapRx<TValue>) => ChURIValue<TValue>,
  ): void {
    this.chargeRx.rxMap(parse, this.#addMap(key));
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

  override rxList(
    key: string,
    parse: (rx: ChURIValueBuilder.ListRx<TValue>) => ChURIValue<TValue>,
  ): void {
    this.chargeRx.rxList(parse, this.#addList(key));
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

  override endMap(): ChURIMap<TValue> {
    return this.#map;
  }

}

const OpaqueListRx = /*#__PURE__*/ OpaqueURIChargeRx.ListRx;

class ChURIValueBuilder$ListRx<out TValue, out TRx extends ChURIValueBuilder<TValue>>
  extends OpaqueListRx<TValue, ChURIValue<TValue>, TRx>
  implements ChURIValueBuilder.ListRx<TValue, TRx> {

  readonly #list: ChURIList<TValue>;

  constructor(chargeRx: TRx, list: ChURIList<TValue> = []) {
    super(chargeRx);
    this.#list = list;
  }

  override add(charge: ChURIValue<TValue>): void {
    this.#list.push(charge);
  }

  override endList(): ChURIList<TValue> {
    return this.#list;
  }

}

const OpaqueDirectiveRx = /*#__PURE__*/ OpaqueURIChargeRx.DirectiveRx;

class ChURIValueBuilder$DirectiveRx<out TValue, out TRx extends ChURIValueBuilder<TValue>>
  extends OpaqueDirectiveRx<TValue, ChURIValue<TValue>, TRx>
  implements ChURIValueBuilder.DirectiveRx<TValue, TRx> {

  readonly #rawName: string;
  #value: ChURIDirective$Builder<TValue> = ChURIDirective$none;

  constructor(chargeRx: TRx, rawName: string) {
    super(chargeRx, rawName);
    this.#rawName = rawName;
  }

  override add(charge: ChURIValue<TValue>): void {
    this.#value = this.#value.add(charge);
  }

  override endDirective(): ChURIDirective<ChURIValue<TValue>> {
    return this.#value.build(this, this.#rawName);
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
