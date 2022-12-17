import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { UcDirective, UcEntity, UcList, UcMap, UcPrimitive, UcValue } from './uc-value.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class UcValueBuilder<out TValue = UcPrimitive>
  implements URIChargeRx<TValue, UcValue<TValue>> {

  static get ValueRx(): UcValueBuilder.ValueRx.Constructor {
    return UcValueBuilder$ValueRx;
  }

  static get MapRx(): UcValueBuilder.MapRx.Constructor {
    return UcValueBuilder$MapRx;
  }

  static get ListRx(): UcValueBuilder.ListRx.Constructor {
    return UcValueBuilder$ListRx;
  }

  static get DirectiveRx(): UcValueBuilder.DirectiveRx.Constructor {
    return UcValueBuilder$DirectiveRx;
  }

  get ns(): UcValueBuilder.Namespace {
    return this.constructor as typeof UcValueBuilder;
  }

  get none(): UcValue<TValue> {
    return null;
  }

  createEntity(rawEntity: string): UcValue<TValue> {
    return new UcEntity(rawEntity);
  }

  createValue(value: TValue | UcPrimitive, _type: string): UcValue<TValue> {
    return value;
  }

  rxValue(parse: (rx: UcValueBuilder.ValueRx<TValue>) => UcValue<TValue>): UcValue<TValue> {
    return parse(new this.ns.ValueRx(this));
  }

  rxMap(
    parse: (rx: UcValueBuilder.MapRx<TValue>) => UcValue<TValue>,
    map?: UcMap<TValue>,
  ): UcValue<TValue> {
    return parse(new this.ns.MapRx(this, map));
  }

  rxList(
    parse: (rx: UcValueBuilder.ListRx<TValue>) => UcValue<TValue>,
    list?: UcList<TValue>,
  ): UcValue<TValue> {
    return parse(new this.ns.ListRx(this, list));
  }

  rxDirective(
    rawName: string,
    parse: (rx: UcValueBuilder.DirectiveRx<TValue>) => UcValue<TValue>,
  ): UcValue<TValue> {
    return parse(new this.ns.DirectiveRx(this, rawName));
  }

}

export namespace UcValueBuilder {
  export interface Namespace {
    readonly ValueRx: ValueRx.Constructor;
    readonly MapRx: MapRx.Constructor;
    readonly ListRx: ListRx.Constructor;
    readonly DirectiveRx: DirectiveRx.Constructor;
  }

  export type ValueRx<
    TValue = UcPrimitive,
    TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
  > = URIChargeRx.ValueRx<TValue, UcValue<TValue>, TRx>;

  export namespace ValueRx {
    export type Constructor = new <
      TValue,
      TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
    >(
      chargeRx: TRx,
    ) => ValueRx<TValue, TRx>;
  }

  export type MapRx<
    TValue = UcPrimitive,
    TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
  > = URIChargeRx.MapRx<TValue, UcValue<TValue>, TRx>;

  export namespace MapRx {
    export type Constructor = new <
      TValue,
      TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      map?: UcMap<TValue>,
    ) => MapRx<TValue, TRx>;
  }

  export type ListRx<
    TValue = UcPrimitive,
    TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
  > = URIChargeRx.ListRx<TValue, UcValue<TValue>, TRx>;

  export namespace ListRx {
    export type Constructor = new <
      TValue,
      TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      list?: UcList<TValue>,
    ) => ListRx<TValue, TRx>;
  }

  export type DirectiveRx<
    TValue = UcPrimitive,
    TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
  > = URIChargeRx.DirectiveRx<TValue, UcValue<TValue>, TRx>;

  export namespace DirectiveRx {
    export type Constructor = new <
      TValue,
      TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      rawName: string,
    ) => DirectiveRx<TValue, TRx>;
  }
}

const OpaqueValueRx = /*#__PURE__*/ OpaqueURIChargeRx.ValueRx;

class UcValueBuilder$ValueRx<out TValue, out TRx extends UcValueBuilder<TValue>>
  extends OpaqueValueRx<TValue, UcValue<TValue>, TRx>
  implements UcValueBuilder.ValueRx<TValue, TRx> {

  #value: UcValue$Builder<TValue> = UcValue$none;

  override add(charge: UcValue<TValue>): void {
    this.#value = this.#value.add(charge);
  }

  override end(): UcValue<TValue> {
    return this.#value.build(this);
  }

}

interface UcValue$Builder<TValue> {
  add(value: UcValue<TValue>): UcValue$Builder<TValue>;
  build(rx: URIChargeRx.ValueRx<TValue, UcValue<TValue>>): UcValue<TValue>;
}

class UcValue$None<TValue> implements UcValue$Builder<TValue> {

  add(value: UcValue<TValue>): UcValue$Single<TValue> {
    return new UcValue$Single(value);
  }

  build(rx: URIChargeRx.ValueRx<TValue, UcValue<TValue>>): UcValue<TValue> {
    return rx.chargeRx.none;
  }

}

const UcValue$none: UcValue$Builder<any> = /*#__PURE__*/ new UcValue$None();

class UcValue$Single<TValue> implements UcValue$Builder<TValue> {

  readonly #value: UcValue<TValue>;

  constructor(value: UcValue<TValue>) {
    this.#value = value;
  }

  add(value: UcValue<TValue>): UcValue$List<TValue> {
    return new UcValue$List([this.#value, value]);
  }

  build(_rx: URIChargeRx.ValueRx<TValue, UcValue<TValue>>): UcValue<TValue> {
    return this.#value;
  }

}

class UcValue$List<TValue> implements UcValue$Builder<TValue> {

  readonly #list: UcList<TValue>;

  constructor(list: UcList<TValue>) {
    this.#list = list;
  }

  add(value: UcValue<TValue>): this {
    this.#list.push(value);

    return this;
  }

  build(_rx: URIChargeRx.ValueRx<TValue, UcValue<TValue>>): UcValue<TValue> {
    return this.#list;
  }

}

const OpaqueMapRx = /*#__PURE__*/ OpaqueURIChargeRx.MapRx;

class UcValueBuilder$MapRx<out TValue, out TRx extends UcValueBuilder<TValue>>
  extends OpaqueMapRx<TValue, UcValue<TValue>, TRx>
  implements UcValueBuilder.MapRx<TValue, TRx> {

  readonly #map: UcMap<TValue>;

  constructor(chargeRx: TRx, map: UcMap<TValue> = {}) {
    super(chargeRx);
    this.#map = map;
  }

  override put(key: string, charge: UcValue<TValue>): void {
    this.#map[key] = charge;
  }

  override rxMap(key: string, parse: (rx: UcValueBuilder.MapRx<TValue>) => UcValue<TValue>): void {
    this.chargeRx.rxMap(parse, this.#addMap(key));
  }

  #addMap(key: string): UcMap<TValue> {
    const prevValue = this.#map[key];
    let map: UcMap<TValue>;

    if (prevValue && typeof prevValue === 'object' && !Array.isArray(prevValue)) {
      map = prevValue as UcMap<TValue>;
    } else {
      this.put(key, (map = {}));
    }

    return map;
  }

  override rxList(
    key: string,
    parse: (rx: UcValueBuilder.ListRx<TValue>) => UcValue<TValue>,
  ): void {
    this.chargeRx.rxList(parse, this.#addList(key));
  }

  #addList(key: string): UcList<TValue> {
    const prevValue = this.#map[key];
    let list: UcList<TValue>;

    if (Array.isArray(prevValue)) {
      list = prevValue;
    } else {
      this.put(key, (list = prevValue != null ? [prevValue] : []));
    }

    return list;
  }

  override endMap(): UcMap<TValue> {
    return this.#map;
  }

}

const OpaqueListRx = /*#__PURE__*/ OpaqueURIChargeRx.ListRx;

class UcValueBuilder$ListRx<out TValue, out TRx extends UcValueBuilder<TValue>>
  extends OpaqueListRx<TValue, UcValue<TValue>, TRx>
  implements UcValueBuilder.ListRx<TValue, TRx> {

  readonly #list: UcList<TValue>;

  constructor(chargeRx: TRx, list: UcList<TValue> = []) {
    super(chargeRx);
    this.#list = list;
  }

  override add(charge: UcValue<TValue>): void {
    this.#list.push(charge);
  }

  override end(): UcList<TValue> {
    return this.#list;
  }

}

const OpaqueDirectiveRx = /*#__PURE__*/ OpaqueURIChargeRx.DirectiveRx;

class UcValueBuilder$DirectiveRx<out TValue, out TRx extends UcValueBuilder<TValue>>
  extends OpaqueDirectiveRx<TValue, UcValue<TValue>, TRx>
  implements UcValueBuilder.DirectiveRx<TValue, TRx> {

  readonly #rawName: string;
  #value: UcDirective$Builder<TValue> = UcDirective$none;

  constructor(chargeRx: TRx, rawName: string) {
    super(chargeRx, rawName);
    this.#rawName = rawName;
  }

  override add(charge: UcValue<TValue>): void {
    this.#value = this.#value.add(charge);
  }

  override end(): UcDirective<UcValue<TValue>> {
    return this.#value.build(this, this.#rawName);
  }

}

interface UcDirective$Builder<TValue> {
  add(value: UcValue<TValue>): UcDirective$Builder<TValue>;
  build(
    rx: URIChargeRx.DirectiveRx<TValue, UcValue<TValue>>,
    rawName: string,
  ): UcDirective<UcValue<TValue>>;
}

class UcDirective$None<TValue> implements UcDirective$Builder<TValue> {

  add(value: UcValue<TValue>): UcDirective$Single<TValue> {
    return new UcDirective$Single(value);
  }

  build(
    rx: URIChargeRx.DirectiveRx<TValue, UcValue<TValue>>,
    rawName: string,
  ): UcDirective<UcValue<TValue>> {
    return new UcDirective(rawName, rx.chargeRx.none);
  }

}

const UcDirective$none: UcDirective$Builder<any> = /*#__PURE__*/ new UcDirective$None();

class UcDirective$Single<TValue> implements UcDirective$Builder<TValue> {

  readonly #value: UcValue<TValue>;

  constructor(value: UcValue<TValue>) {
    this.#value = value;
  }

  add(value: UcValue<TValue>): UcDirective$List<TValue> {
    return new UcDirective$List([this.#value, value]);
  }

  build(
    _rx: URIChargeRx.DirectiveRx<TValue, UcValue<TValue>>,
    rawName: string,
  ): UcDirective<UcValue<TValue>> {
    return new UcDirective(rawName, this.#value);
  }

}

class UcDirective$List<TValue> implements UcDirective$Builder<TValue> {

  readonly #list: UcList<TValue>;

  constructor(list: UcList<TValue>) {
    this.#list = list;
  }

  add(value: UcValue<TValue>): this {
    this.#list.push(value);

    return this;
  }

  build(
    _rx: URIChargeRx.DirectiveRx<TValue, UcValue<TValue>>,
    rawName: string,
  ): UcDirective<UcValue<TValue>> {
    return new UcDirective(rawName, this.#list);
  }

}
