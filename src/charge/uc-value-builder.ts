import { UcDirective } from '../schema/uc-directive.js';
import { UcEntity } from '../schema/uc-entity.js';
import { UcList } from '../schema/uc-list.js';
import { UcMap } from '../schema/uc-map.js';
import { UcPrimitive } from '../schema/uc-primitive.js';
import { UcValue } from '../schema/uc-value.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { URIChargeRx } from './uri-charge-rx.js';

/**
 * Simple URI charge builder.
 *
 * Represents received URI charge as {@link UcValue native} JavaScript values.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 */
export class UcValueBuilder<out TValue = UcPrimitive>
  implements URIChargeRx<TValue, UcValue<TValue>> {

  /**
   * Simple URI charge values(s) builder.
   *
   * Represents received value charge(s) as {@link UcValue native} JavaScript value.
   */
  static get ValueRx(): UcValueBuilder.ValueRx.Constructor {
    return UcValueBuilder$ValueRx;
  }

  /**
   * Simple URI charge map builder.
   *
   * Represents a map with received entry value charge(s) as {@link UcMap JavaScript object}.
   */
  static get MapRx(): UcValueBuilder.MapRx.Constructor {
    return UcValueBuilder$MapRx;
  }

  /**
   * Simple URI charge list builder.
   *
   * Represents a list with received item value charge(s) as {@link UcList JavaScript array}.
   */
  static get ListRx(): UcValueBuilder.ListRx.Constructor {
    return UcValueBuilder$ListRx;
  }

  get ns(): UcValueBuilder.Namespace {
    return this.constructor as typeof UcValueBuilder;
  }

  get none(): UcValue<TValue> {
    return null;
  }

  createDirective(rawName: string, rawArg: string): UcValue<TValue> {
    return new UcDirective(rawName, rawArg);
  }

  createEntity(rawEntity: string): UcValue<TValue> {
    return new UcEntity(rawEntity);
  }

  createValue(value: TValue | UcPrimitive, _type: string): UcValue<TValue> {
    return value;
  }

  rxValue(
    build: (rx: UcValueBuilder.ValueRx<TValue>) => UcValue<TValue>,
    base?: UcValue<TValue>,
  ): UcValue<TValue> {
    return build(new this.ns.ValueRx(this, base));
  }

  rxMap(
    build: (rx: UcValueBuilder.MapRx<TValue>) => UcValue<TValue>,
    map?: UcMap<TValue>,
  ): UcValue<TValue> {
    return build(new this.ns.MapRx(this, map));
  }

  rxList(build: (rx: UcValueBuilder.ListRx<TValue>) => UcValue<TValue>): UcValue<TValue> {
    return build(new this.ns.ListRx(this));
  }

}

export namespace UcValueBuilder {
  export interface Namespace {
    readonly ValueRx: ValueRx.Constructor;
    readonly MapRx: MapRx.Constructor;
    readonly ListRx: ListRx.Constructor;
  }

  /**
   * Simple URI charge values(s) builder.
   *
   * Represents received value charge(s) as {@link UcValue native} JavaScript value.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   * @typeParam TRx - Type of top-level URI charge builder.
   */
  export type ValueRx<
    TValue = UcPrimitive,
    TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
  > = URIChargeRx.ValueRx<TValue, UcValue<TValue>, TRx>;

  export namespace ValueRx {
    /**
     * Constructs simple URI charge values(s) builder.
     *
     * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
     * @typeParam TRx - Type of top-level URI charge builder.
     * @param chargeRx - Top-level URI charge builder.
     * @param base - Base charge to replace or modify.
     */
    export type Constructor = new <
      TValue,
      TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      base?: UcValue<TValue>,
    ) => ValueRx<TValue, TRx>;
  }

  /**
   * Simple URI charge map builder.
   *
   * Represents a map with received entry value charge(s) as {@link UcMap JavaScript object}.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   * @typeParam TRx - Type of top-level URI charge builder.
   */
  export interface MapRx<
    TValue = UcPrimitive,
    TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
  > extends URIChargeRx.MapRx<TValue, UcValue<TValue>, TRx> {
    endMap(): UcMap<TValue>;
  }

  export namespace MapRx {
    /**
     * Constructs simple URI charge map builder.
     *
     * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
     * @typeParam TRx - Type of top-level URI charge builder.
     * @param chargeRx - Top-level URI charge builder.
     * @param map - Map object to modify.
     */
    export type Constructor = new <
      TValue,
      TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
    >(
      chargeRx: TRx,
      map?: UcMap<TValue>,
    ) => MapRx<TValue, TRx>;
  }

  /**
   * Simple URI charge list builder.
   *
   * Represents a list with received item value charge(s) as {@link UcList JavaScript array}.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   * @typeParam TRx - Type of top-level URI charge builder.
   */
  export interface ListRx<
    TValue = UcPrimitive,
    TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
  > extends URIChargeRx.ValueRx<TValue, UcValue<TValue>, TRx> {
    end(): UcList<TValue>;
  }

  export namespace ListRx {
    /**
     * Constructs simple URI charge list builder.
     *
     * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
     * @typeParam TRx - Type of top-level URI charge builder.
     * @param chargeRx - Top-level URI charge builder.
     */
    export type Constructor = new <
      TValue,
      TRx extends UcValueBuilder<TValue> = UcValueBuilder<TValue>,
    >(
      chargeRx: TRx,
    ) => ListRx<TValue, TRx>;
  }
}

const OpaqueValueRx = /*#__PURE__*/ OpaqueURIChargeRx.ValueRx;

class UcValueBuilder$ValueRx<out TValue, out TRx extends UcValueBuilder<TValue>>
  extends OpaqueValueRx<TValue, UcValue<TValue>, TRx>
  implements UcValueBuilder.ValueRx<TValue, TRx> {

  readonly #base: UcValue<TValue> | undefined;
  #builder: UcValue$Builder<TValue> = UcValue$none;

  constructor(chargeRx: TRx, base?: UcValue<TValue>) {
    super(chargeRx);
    this.#base = base;
  }

  override add(charge: UcValue<TValue>): void {
    this.#builder = this.#builder.add(charge);
  }

  override rxMap(
    build: (
      rx: URIChargeRx.MapRx<TValue, UcValue<TValue>, URIChargeRx<TValue, UcValue<TValue>>>,
    ) => UcValue<TValue>,
  ): void {
    if (isUcMap(this.#base)) {
      this.add(this.chargeRx.rxMap(build, this.#base));
    } else {
      super.rxMap(build);
    }
  }

  override asList(): void {
    this.#builder = this.#builder.toList();
  }

  override end(): UcValue<TValue> {
    return this.#builder.build(this);
  }

}

function isUcMap<TValue>(value: UcValue<TValue>): value is UcMap<TValue> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const { constructor } = value;

  return !constructor || constructor === Object;
}

interface UcValue$Builder<TValue> {
  add(value: UcValue<TValue>): UcValue$Builder<TValue>;
  build(rx: URIChargeRx.ValueRx<TValue, UcValue<TValue>>): UcValue<TValue>;
  toList(): UcValue$Builder<TValue>;
}

class UcValue$None<TValue> implements UcValue$Builder<TValue> {

  add(value: UcValue<TValue>): UcValue$Single<TValue> {
    return new UcValue$Single(value);
  }

  build(rx: URIChargeRx.ValueRx<TValue, UcValue<TValue>>): UcValue<TValue> {
    return rx.chargeRx.none;
  }

  toList(): UcValue$Builder<TValue> {
    return new UcValue$List([]);
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

  toList(): UcValue$Builder<TValue> {
    return new UcValue$List([this.#value]);
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

  toList(): this {
    return this;
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

  override rxEntry(
    key: string,
    build: (
      rx: URIChargeRx.ValueRx<TValue, UcValue<TValue>, URIChargeRx<TValue, UcValue<TValue>>>,
    ) => UcValue<TValue>,
  ): void {
    this.#map[key] = this.chargeRx.rxValue(build, this.#map[key]);
  }

  override addSuffix(suffix: string): void {
    this.#map[suffix] = '';
  }

  override endMap(): UcMap<TValue> {
    return this.#map;
  }

}

class UcValueBuilder$ListRx<out TValue, out TRx extends UcValueBuilder<TValue>>
  extends OpaqueValueRx<TValue, UcValue<TValue>, TRx>
  implements UcValueBuilder.ListRx<TValue, TRx> {

  readonly #list: UcList<TValue> = [];

  override add(charge: UcValue<TValue>): void {
    this.#list.push(charge);
  }

  override end(): UcList<TValue> {
    return this.#list;
  }

}
