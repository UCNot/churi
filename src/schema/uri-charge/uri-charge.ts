import { AllUcrx } from '../../rx/all.ucrx.js';
import { TokenUcrx } from '../../rx/token.ucrx.js';
import { UctxMode } from '../../rx/uctx-mode.js';
import { Uctx } from '../../rx/uctx.js';
import { UcMeta } from '../meta/uc-meta.js';
import { UcUnknown } from '../unknown/uc-unknown.js';

/**
 * Generic URI charge representation.
 *
 * Instances of this class may represent any charge type, including {@link URICharge.Map maps}
 * and {@link URICharge.List lists}. When part of the charge is not available, corresponding property or method returns
 * {@link URICharge.none}, which means the absence of charge.
 */
export abstract class URICharge implements Uctx {

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
  abstract get value(): UcUnknown | null | undefined;

  /**
   * Type of this charge {@link value}.
   *
   * `undefined` when the charge has no value.
   */
  abstract get type(): string | undefined;

  /**
   * Metadata associated with this value.
   */
  abstract get meta(): UcMeta.Freezed;

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
  abstract isSome(): this is URICharge.Some;

  /**
   * Checks whether this charge has own {@link value} or at leas one {@link at list item}.
   *
   * @returns `true` for {@link URICharge.Single single-valued charge} and non-empty {@link URICharge.List list}.
   */
  abstract hasValues(): this is URICharge.WithValues;

  /**
   * Checks whether this charge is a {@link URICharge.Single single-valued} one.
   *
   * @returns `true` for single-valued charges only; `false` for everything else, including lists with single item.
   */
  abstract isSingle(): this is URICharge.Single;

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
  abstract isMap(): this is URICharge.Map;

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
  abstract at(index: number): URICharge.Some | URICharge.None;

  /**
   * Iterates over charge item charges.
   *
   * - For the {@link URICharge.List list} iterates over its items,
   * - For {@link URICharge.None absent charge} never iterates.
   * - For everything else iterates over the charge instance itself.
   *
   * @returns Iterable iterator over present item charges.
   */
  abstract list(): IterableIterator<URICharge.Some>;

  /**
   * Obtains a {@link URICharge.Map map} entry with the given `key`.
   *
   * Always returns {@link URICharge.none none} for {@link isMap non-map} instance.
   *
   * @param key - Target entry key.
   *
   * @returns Either entry charge, or {@link URICharge.none none} if there is no such entry.
   */
  abstract get(key: string): URICharge.Some | URICharge.None;

  /**
   * Iterates over {@link URICharge.Map map} entries.
   *
   * Never iterates for {@link isMap non-map} instance.
   *
   * @returns Iterable iterator of entry key/charge pairs.
   */
  abstract entries(): IterableIterator<[string, URICharge.Some]>;

  /**
   * Iterates over {@link URICharge.Map map} entry keys.
   *
   * Never iterates for {@link isMap non-map} instance.
   *
   * @returns Iterable iterator of entry keys.
   */
  abstract keys(): IterableIterator<string>;

  /**
   * Transfers this URI charge to the given receiver.
   *
   * @param rx - Charge receiver.
   * @param mode - Transfer mode.
   */
  abstract toUC(rx: AllUcrx, mode: UctxMode): void;

  /**
   * Builds string representation of URI charge.
   *
   * @returns String representation.
   */
  toString(): string {
    return TokenUcrx.print(this)!;
  }

}

export namespace URICharge {
  /**
   * URI charge without own value or items. E.g. a {@link URICharge.Map map}, an empty
   * {@link URICharge.List list}, or {@link URICharge.None none}.
   */
  export interface WithoutValues extends URICharge {
    get value(): undefined;
    get type(): undefined;

    hasValues(): false;
    isSingle(): false;
    isList(): false;

    at(index: 0 | -1): this;
    at(index: number): URICharge.Some | None;
  }

  /**
   * URI charge without map entries.
   */
  export interface WithoutEntries extends URICharge {
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
  export interface None extends URICharge, WithoutValues, WithoutEntries {
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
  }

  /**
   * URI charge that represents {@link URICharge#isSome something}, in contrast to {@link URICharge.None none}.
   */
  export interface Some extends URICharge {
    isNone(): false;
    isSome(): true;
  }

  /**
   * URI charge with own value or list items.
   */
  export interface WithValues extends Some {
    get value(): UcUnknown | null;
    get type(): string;

    hasValues(): true;
    isMap(): false;
  }

  /**
   * Single-valued charge.
   */
  export interface Single extends WithValues {
    isList(): false;

    at(index: 0 | -1): this;
    at(index: number): this | None;
    list(): IterableIterator<this>;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;
  }

  /**
   * URI charge list.
   */
  export interface List extends Some, WithoutEntries {
    isNone(): false;
    isSome(): true;
    isList(): true;
    isMap(): false;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;
  }

  /**
   * URI charge map.
   */
  export interface Map extends Some, WithoutValues {
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
  }
}

class URICharge$None extends URICharge implements URICharge.None {

  get value(): undefined {
    return;
  }

  get type(): undefined {
    return;
  }

  get meta(): UcMeta.Freezed {
    return UcMeta.empty;
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

  override toUC(_rx: AllUcrx, _mode: UctxMode): void {
    // Nothing to charge.
  }

  override toString(): string {
    return '!None';
  }

}

const URICharge$None$instance = /*#__PURE__*/ new URICharge$None();
