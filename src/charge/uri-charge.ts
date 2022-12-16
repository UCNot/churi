import { UcDirective, UcEntity, UcPrimitive } from './uc-value.js';
import { URIChargeEncodable } from './uri-charge-encodable.js';

export abstract class URICharge<out TValue = UcPrimitive> implements URIChargeEncodable {

  static get none(): URICharge.None {
    return URICharge$None$instance;
  }

  abstract get value(): URIChargeItem<TValue> | undefined;
  abstract get type(): string | undefined;

  abstract get length(): number;

  abstract isNone(): this is URICharge.None;
  abstract isSome(): this is URICharge.Some<TValue>;

  abstract hasValues(): this is URICharge.WithValues<TValue>;
  abstract isSingle(): this is URICharge.Single<TValue>;
  abstract isList(): boolean;

  abstract isMap(): this is URICharge.Map<TValue>;

  abstract at(index: number): URICharge.Some<TValue> | URICharge.None;
  abstract list(): IterableIterator<URICharge.Some<TValue>>;

  abstract get(key: string): URICharge.Some<TValue> | URICharge.None;
  abstract entries(): IterableIterator<[string, URICharge.Some<TValue>]>;
  abstract keys(): IterableIterator<string>;

  abstract encodeURICharge(placement: URIChargeEncodable.Placement): string | undefined;

}

export type URIChargeItem<TValue = UcPrimitive> =
  | TValue
  | UcPrimitive
  | UcEntity
  | UcDirective<URICharge<TValue>>;

export namespace URICharge {
  export interface WithoutValues<out TValue = UcPrimitive> extends URICharge<TValue> {
    get value(): undefined;
    get type(): undefined;

    hasValues(): false;
    isSingle(): false;
    isList(): false;

    at(index: 0 | -1): this;
    at(index: number): URICharge.Some<TValue> | None;
  }

  export interface WithoutEntries<out TValue = UcPrimitive> extends URICharge<TValue> {
    isMap(): false;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;
  }

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

    encodeURICharge(_placement: URIChargeEncodable.Placement): undefined;
  }

  export interface Some<out TValue = UcPrimitive> extends URICharge<TValue>, URIChargeEncodable {
    isNone(): false;
    isSome(): true;

    encodeURICharge(placement: URIChargeEncodable.Placement): string;
  }

  export interface WithValues<out TValue = UcPrimitive> extends Some<TValue> {
    get value(): URIChargeItem<TValue>;
    get type(): string;

    hasValues(): true;
    isMap(): false;
  }

  export interface Single<out TValue = UcPrimitive> extends WithValues<TValue> {
    isList(): false;

    at(index: 0 | -1): this;
    at(index: number): this | None;
    list(): IterableIterator<this>;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;

    encodeURICharge(placement: URIChargeEncodable.Placement): string;
  }

  export interface List<out TValue = UcPrimitive> extends Some<TValue>, WithoutEntries<TValue> {
    isNone(): false;
    isSome(): true;
    isList(): true;
    isMap(): false;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;

    encodeURICharge(placement: URIChargeEncodable.Placement): string;
  }

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

    encodeURICharge(placement: URIChargeEncodable.Placement): string;
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

  override encodeURICharge(_placement: URIChargeEncodable.Placement): undefined {
    return;
  }

  override toString(): string {
    return '!None';
  }

}

const URICharge$None$instance = /*#__PURE__*/ new URICharge$None();
