import { UcDirective, UcEntity, UcPrimitive } from './uc-value.js';
import { URIChargeable } from './uri-chargeable.js';

/**
 * Generic URI charge representation.
 *
 * Instances of this class may represent any charge type, including {@link URICharge.Map maps}
 * and {@link URICharge.List lists}. When part of the charge is not available, corresponding property or method returns
 * {@link URICharge.none}, which means the absence of charge.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 */
export abstract class URICharge<out TValue = UcPrimitive> implements URIChargeable {

  /**
   * URI charge instance representing the absent charge.
   */
  static get none(): URICharge.None {
    return URICharge$None$instance;
  }

  /**
   * Own value of the charge or the value of the first item of the {@link URICharge.List list}.
   *
   * `undefined` when the charge has no own value, e.g. when it is a {@link URICharge.Map map}, an empty
   * {@link URICharge.List list}, or {@link URICharge.None none}.
   */
  abstract get value(): URIChargeItem<TValue> | undefined;

  /**
   * Type of this charge {@link value}.
   *
   * `undefined` when the charge has no value.
   */
  abstract get type(): string | undefined;

  /**
   * The number of items this value has.
   *
   * - Always `0` for {@link URICharge.Map maps} and {@link URICharge.None absent charge}.
   * - Always `1` for {@link URICharge.Single single-valued charge}.
   * - May be any for {@link URICharge,List lists}.
   */
  abstract get length(): number;

  /**
   * Checks whether this charge is {@link URICharge.None none}.
   *
   * @returns `true` only for {@link URICharge.none} instance.
   */
  abstract isNone(): this is URICharge.None;

  /**
   * Checks whether this charge represents {@link URICharge.Some something}.
   *
   * @returns `true` for any charge instance, except {@link URICharge.none} instance.
   */
  abstract isSome(): this is URICharge.Some<TValue>;

  /**
   * Checks whether this charge has own {@link value} or at leas one {@link at list item}.
   *
   * @returns `true` for {@link URICharge.Single single-valued charge} and non-empty {@link URICharge.List list}.
   */
  abstract hasValues(): this is URICharge.WithValues<TValue>;

  /**
   * Checks whether this charge is a {@link URICharge.Single single-valued} one.
   *
   * @returns `true` for single-valued charges only; `false` for everything else, including lists with single item.
   */
  abstract isSingle(): this is URICharge.Single<TValue>;

  /**
   * Checks whether this charge is a {@link URICharge.List list}.
   *
   * @returns `true` for any list, including zero-length one; `false` for everything else.
   */
  abstract isList(): boolean;

  /**
   * Checks whether this charge is a {@link URICharge.Map map}.
   *
   * @returns `true` for any map, including empty one; `false` for everything else.
   */
  abstract isMap(): this is URICharge.Map<TValue>;

  /**
   * Obtains an item charge at the given `index`.
   *
   * For {@link URICharge.Single single-valued} charge, {@link URICharge.Map map}, and {@link URICharge.None} always
   * returns itself for indices `0` and `-1`, and {@link URICharge.none none} for any other index.
   *
   * For the {@link URICharge.List list} returns an URI charge of the item at the given index,
   * or {@link URICharge.none none} if there is no such item.
   *
   * @param index - Zero-based index of the list item to be returned. Negative
   * index counts back from the end of the list — if `index < 0`, `index + array.length` is accessed.
   *
   * @returns Target item charge, or {@link URICharge.none none} if there is no such item.
   */
  abstract at(index: number): URICharge.Some<TValue> | URICharge.None;

  /**
   * Iterates over charge item charges.
   *
   * - For the {@link URICharge.List list} iterates over its items,
   * - For {@link URICharge.None absent charge} never iterates.
   * - For everything else iterates over the charge instance itself.
   *
   * @returns Iterable iterator over present item charges.
   */
  abstract list(): IterableIterator<URICharge.Some<TValue>>;

  /**
   * Obtains a {@link URICharge.Map map} entry with the given `key`.
   *
   * Always returns {@link URICharge.none none} for {@link isMap non-map} instance.
   *
   * @param key - Target entry key.
   *
   * @returns Either entry charge, or {@link URICharge.none none} if there is no such entry.
   */
  abstract get(key: string): URICharge.Some<TValue> | URICharge.None;

  /**
   * Iterates over {@link URICharge.Map map} entries.
   *
   * Never iterates for {@link isMap non-map} instance.
   *
   * @returns Iterable iterator of entry key/charge pairs.
   */
  abstract entries(): IterableIterator<[string, URICharge.Some<TValue>]>;

  /**
   * Iterates over {@link URICharge.Map map} entry keys.
   *
   * Never iterates for {@link isMap non-map} instance.
   *
   * @returns Iterable iterator of entry keys.
   */
  abstract keys(): IterableIterator<string>;

  /**
   * Encodes this URI charge.
   *
   * @param placement -  The supposed placement of encoded value.
   *
   * @returns String with encoded value, or `undefined` for {@link URICharge.none absent charge}.
   */
  abstract chargeURI(placement: URIChargeable.Placement): string | undefined;

}

/**
 * A list item value or own value of the charge.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 */
export type URIChargeItem<TValue = UcPrimitive> =
  | TValue
  | UcPrimitive
  | UcEntity
  | UcDirective<URICharge<TValue>>;

export namespace URICharge {
  /**
   * URI charge without own value or items. E.g. a {@link URICharge.Map map}, an empty
   * {@link URICharge.List list}, or {@link URICharge.None none}.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   */
  export interface WithoutValues<out TValue = UcPrimitive> extends URICharge<TValue> {
    get value(): undefined;
    get type(): undefined;

    hasValues(): false;
    isSingle(): false;
    isList(): false;

    at(index: 0 | -1): this;
    at(index: number): URICharge.Some<TValue> | None;
  }

  /**
   * URI charge without map entries.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   */
  export interface WithoutEntries<out TValue = UcPrimitive> extends URICharge<TValue> {
    isMap(): false;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;
  }

  /**
   * Absent URI charge.
   *
   * The only instance of this type is {@link URICharge.none}.
   */
  export interface None
    extends URICharge<undefined>,
      WithoutValues<undefined>,
      WithoutEntries<undefined> {
    get value(): undefined;
    get type(): undefined;
    get length(): 0;

    isNone(): true;
    isSome(): false;

    hasValues(): false;
    isSingle(): false;
    isList(): false;

    isMap(): false;

    at(index: 0 | -1): this;
    at(index: number): None;
    list(): IterableIterator<never>;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;

    chargeURI(_placement: URIChargeable.Placement): undefined;
  }

  /**
   * URI charge that represents {@link URICharge#isSome something}, in contrast to {@link URICharge.None none}.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   */
  export interface Some<out TValue = UcPrimitive> extends URICharge<TValue>, URIChargeable {
    isNone(): false;
    isSome(): true;

    chargeURI(placement: URIChargeable.Placement): string;
  }

  /**
   * URI charge with own value or list items.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   */
  export interface WithValues<out TValue = UcPrimitive> extends Some<TValue> {
    get value(): URIChargeItem<TValue>;
    get type(): string;

    hasValues(): true;
    isMap(): false;
  }

  /**
   * Single-valued charge.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   */
  export interface Single<out TValue = UcPrimitive> extends WithValues<TValue> {
    isList(): false;

    at(index: 0 | -1): this;
    at(index: number): this | None;
    list(): IterableIterator<this>;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;

    chargeURI(placement: URIChargeable.Placement): string;
  }

  /**
   * URI charge list.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   */
  export interface List<out TValue = UcPrimitive> extends Some<TValue>, WithoutEntries<TValue> {
    isNone(): false;
    isSome(): true;
    isList(): true;
    isMap(): false;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;

    chargeURI(placement: URIChargeable.Placement): string;
  }

  /**
   * URI charge map.
   *
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   */
  export interface Map<out TValue = UcPrimitive> extends Some<TValue>, WithoutValues<TValue> {
    get value(): undefined;
    get type(): undefined;
    get length(): 0;

    isNone(): false;
    isSome(): true;

    hasValues(): false;
    isSingle(): false;
    isList(): false;

    isMap(): true;

    at(index: 0 | -1): this;
    at(index: number): this | None;
    list(): IterableIterator<this>;

    chargeURI(placement: URIChargeable.Placement): string;
  }
}

class URICharge$None extends URICharge<undefined> implements URICharge.None {

  get value(): undefined {
    return;
  }

  get type(): undefined {
    return;
  }

  get length(): 0 {
    return 0;
  }

  isNone(): true {
    return true;
  }

  isSome(): false {
    return false;
  }

  hasValues(): false {
    return false;
  }

  isSingle(): false {
    return false;
  }

  isList(): false {
    return false;
  }

  isMap(): false {
    return false;
  }

  at(_index: number): this {
    return this;
  }

  *list(): IterableIterator<never> {
    // No items to iterate.
  }

  get(_key: string): this {
    return this;
  }

  *entries(): IterableIterator<never> {
    // Not a map.
  }

  *keys(): IterableIterator<never> {
    // Not a map.
  }

  override chargeURI(_placement: URIChargeable.Placement): undefined {
    return;
  }

  override toString(): string {
    return '!None';
  }

}

const URICharge$None$instance = /*#__PURE__*/ new URICharge$None();
