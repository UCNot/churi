import { chargeURI, chargeURIArray, chargeURIMap } from '../../schema/charge-uri.js';
import { UcUnknown } from '../../schema/unknown/uc-unknown.js';
import { URICharge } from '../../schema/uri-charge/uri-charge.js';
import { URIChargeable } from '../../schema/uri-chargeable.js';

abstract class URICharge$Some extends URICharge implements URICharge.Some {

  override isNone(): false {
    return false;
  }

  override isSome(): true {
    return true;
  }

  abstract chargeURI(placement: URIChargeable.Placement): string;

  override toString(): string {
    return this.chargeURI({});
  }

}

export class URICharge$Single extends URICharge$Some implements URICharge.Single {

  readonly #value: UcUnknown | null;
  readonly #type: string;

  constructor(value: UcUnknown | null, type: string) {
    super();
    this.#value = value;
    this.#type = type;
  }

  override get value(): UcUnknown | null {
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

  override at(index: 0 | -1): this;
  override at(index: number): URICharge.None;
  override at(index: number): this | URICharge.None {
    return index && index !== -1 ? URICharge.none : this;
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

  override chargeURI(placement: URIChargeable.Placement): string {
    return chargeURI(this.#value, placement)!;
  }

}

export class URICharge$Map extends URICharge$Some implements URICharge.Map {

  readonly #map: Map<string, URICharge.Some>;

  constructor(map: Map<string, URICharge.Some>) {
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

  override at(index: 0 | -1): this;
  override at(index: number): this | URICharge.None;
  override at(index: number): this | URICharge.None {
    return index && index !== -1 ? URICharge.none : this;
  }

  override *list(): IterableIterator<this> {
    yield this;
  }

  override get(key: string): URICharge.Some | URICharge.None {
    return this.#map.get(key) ?? URICharge.none;
  }

  override entries(): IterableIterator<[string, URICharge.Some]> {
    return this.#map.entries();
  }

  override keys(): IterableIterator<string> {
    return this.#map.keys();
  }

  override chargeURI(placement: URIChargeable.Placement): string {
    return chargeURIMap(this.#map, placement);
  }

}

export class URICharge$List extends URICharge$Some implements URICharge.List {

  readonly #list: URICharge.Some[];

  constructor(list: URICharge.Some[]) {
    super();
    this.#list = list;
  }

  override get value(): UcUnknown | null | undefined {
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

  override at(index: number): URICharge.Some | URICharge.None {
    const listIndex = index < 0 ? this.#list.length + index : index;

    return (
      (listIndex >= 0 && listIndex < this.#list.length && this.#list[listIndex]) || URICharge.none
    );
  }

  override *list(): IterableIterator<URICharge.Some> {
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

  override chargeURI(placement: URIChargeable.Placement): string {
    return chargeURIArray(this.#list, placement);
  }

}
