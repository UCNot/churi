import { URICharge, URIChargeItem } from '../uri-charge.js';

abstract class URICharge$Some<out TValue>
  extends URICharge<TValue>
  implements URICharge.Some<TValue> {

  override isNone(): false {
    return false;
  }

  override isSome(): true {
    return true;
  }

}

export class URICharge$Single<out TValue>
  extends URICharge$Some<TValue>
  implements URICharge.Single<TValue> {

  readonly #value: URIChargeItem<TValue>;
  readonly #type: string;

  constructor(value: URIChargeItem<TValue>, type: string) {
    super();
    this.#value = value;
    this.#type = type;
  }

  override get value(): URIChargeItem<TValue> {
    return this.#value;
  }

  override get type(): string {
    return this.#type;
  }

  override get length(): 1 {
    return 1;
  }

  override hasValues(): true {
    return true;
  }

  override isSingle(): true {
    return true;
  }

  override isList(): false {
    return false;
  }

  override isMap(): false {
    return false;
  }

  override at(index: 0): this;
  override at(index: number): URICharge.None;
  override at(index: number): this | URICharge.None {
    return index ? URICharge.none : this;
  }

  override *list(): IterableIterator<this> {
    yield this; // Just itself
  }

  override get(_key: string): URICharge.None {
    return URICharge.none;
  }

  override *entries(): IterableIterator<never> {
    // No entries
  }

  override *keys(): IterableIterator<never> {
    // No entries
  }

}

export class URICharge$Map<out TValue>
  extends URICharge$Some<TValue>
  implements URICharge.Map<TValue> {

  readonly #map: Map<string, URICharge.Some<TValue>>;

  constructor(map: Map<string, URICharge.Some<TValue>>) {
    super();
    this.#map = map;
  }

  override get value(): undefined {
    return;
  }

  override get type(): undefined {
    return;
  }

  override get length(): 0 {
    return 0;
  }

  override hasValues(): false {
    return false;
  }

  override isSingle(): false {
    return false;
  }

  override isList(): false {
    return false;
  }

  override isMap(): true {
    return true;
  }

  override at(index: 0): this;
  override at(index: number): this | URICharge.None;
  override at(index: number): this | URICharge.None {
    return index ? URICharge.none : this;
  }

  override *list(): IterableIterator<this> {
    yield this;
  }

  override get(key: string): URICharge.Some<TValue> | URICharge.None {
    return this.#map.get(key) ?? URICharge.none;
  }

  override entries(): IterableIterator<[string, URICharge.Some<TValue>]> {
    return this.#map.entries();
  }

  override keys(): IterableIterator<string> {
    return this.#map.keys();
  }

}

export class URICharge$List<out TValue>
  extends URICharge$Some<TValue>
  implements URICharge.List<TValue> {

  readonly #list: URICharge.Some<TValue>[];

  constructor(list: URICharge.Some<TValue>[]) {
    super();
    this.#list = list;
  }

  override get value(): URIChargeItem<TValue> | undefined {
    return this.at(0).value;
  }

  override get type(): string | undefined {
    const first = this.at(0);

    // First item's type, unless it is a nested list.
    return first.isList() ? undefined : first.type;
  }

  override get length(): number {
    return this.#list.length;
  }

  override hasValues(): boolean {
    return !!this.length;
  }

  override isSingle(): false {
    return false;
  }

  override isList(): true {
    return true;
  }

  override isMap(): false {
    return false;
  }

  override at(index: number): URICharge.Some<TValue> | URICharge.None {
    return index >= 0 && index < this.#list.length ? this.#list[index] : URICharge.none;
  }

  override *list(): IterableIterator<URICharge.Some<TValue>> {
    yield* this.#list;
  }

  override get(_key: string): URICharge.None {
    return URICharge.none;
  }

  override *entries(): IterableIterator<never> {
    // Not a map
  }

  override *keys(): IterableIterator<never> {
    // Not a map
  }

}