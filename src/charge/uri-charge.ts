import { ChURIDirective, ChURIEntity, ChURIPrimitive } from './ch-uri-value.js';

export abstract class URICharge<out TValue = ChURIPrimitive> {

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

}

export type URIChargeItem<TValue = ChURIPrimitive> =
  | TValue
  | ChURIPrimitive
  | ChURIEntity
  | ChURIDirective<URICharge<TValue>>;

export namespace URICharge {
  export interface WithoutValues<out TValue = ChURIPrimitive> extends URICharge<TValue> {
    get value(): undefined;
    get type(): undefined;

    hasValues(): false;
    isSingle(): false;
    isList(): false;

    at(index: 0): this;
    at(index: number): URICharge.Some<TValue> | None;
  }

  export interface WithoutEntries<out TValue = ChURIPrimitive> extends URICharge<TValue> {
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

    at(index: 0): this;
    at(index: number): None;
    list(): IterableIterator<never>;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;
  }

  export interface Some<out TValue = ChURIPrimitive> extends URICharge<TValue> {
    isNone(): false;
    isSome(): true;
  }

  export interface WithValues<out TValue = ChURIPrimitive> extends Some<TValue> {
    get value(): URIChargeItem<TValue>;
    get type(): string;

    hasValues(): true;
    isMap(): false;
  }

  export interface Single<out TValue = ChURIPrimitive> extends WithValues<TValue> {
    isList(): false;

    at(index: 0): this;
    at(index: number): this | None;
    list(): IterableIterator<this>;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;
  }

  export interface List<out TValue = ChURIPrimitive> extends Some<TValue>, WithoutEntries<TValue> {
    isNone(): false;
    isSome(): true;
    isList(): true;
    isMap(): false;

    get(key: string): None;
    entries(): IterableIterator<never>;
    keys(): IterableIterator<never>;
  }

  export interface Map<out TValue = ChURIPrimitive> extends Some<TValue>, WithoutValues<TValue> {
    get value(): undefined;
    get type(): undefined;
    get length(): 0;

    isNone(): false;
    isSome(): true;

    hasValues(): false;
    isSingle(): false;
    isList(): false;

    isMap(): true;

    at(index: 0): this;
    at(index: number): this | None;
    list(): IterableIterator<this>;
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

}

const URICharge$None$instance = /*#__PURE__*/ new URICharge$None();
