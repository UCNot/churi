import {
  ChURIDirectiveConsumer,
  ChURIListConsumer,
  ChURIMapConsumer,
  ChURIValueConsumer,
} from './ch-uri-value-consumer.js';
import { ChURIDirective, ChURIEntity, ChURIPrimitive } from './ch-uri-value.js';
import { URICharge$List, URICharge$Map, URICharge$Single } from './impl/uri-charge.some.js';
import { URICharge } from './uri-charge.js';

export class URIChargeBuilder<in out TValue = ChURIPrimitive>
  implements ChURIValueConsumer<TValue, URICharge<TValue>> {

  set(value: ChURIPrimitive | TValue, type: string): URICharge.Some<TValue> {
    return new URICharge$Single(value, type);
  }

  setEntity(rawEntity: string): URICharge.Some<TValue> {
    return new URICharge$Single<TValue>(new ChURIEntity(rawEntity), 'entity');
  }

  startMap(): ChURIMapConsumer<TValue, URICharge<TValue>> {
    return new URIChargeMapBuilder();
  }

  startList(): ChURIListConsumer<TValue, URICharge<TValue>> {
    return new URIChargeListBuilder();
  }

  startDirective(rawName: string): ChURIDirectiveConsumer<TValue, URICharge<TValue>> {
    return new URIChargeDirectiveBuilder(rawName);
  }

}

export class URIChargeMapBuilder<in out TValue = ChURIPrimitive>
  implements ChURIMapConsumer<TValue, URICharge.Map<TValue>> {

  readonly #endMap?: (map: URICharge.Map<TValue>) => void;
  readonly #map: Map<string, URICharge.Some<TValue>>;

  constructor(endMap?: (map: URICharge.Map<TValue>) => void, base?: URICharge.Map<TValue>) {
    this.#endMap = endMap;
    this.#map = new Map(base?.entries());
  }

  put(key: string, value: TValue | ChURIPrimitive, type: string): void {
    this.#map.set(key, new URICharge$Single(value, type));
  }

  putEntity(key: string, rawEntity: string): void {
    this.#map.set(key, new URICharge$Single<TValue>(new ChURIEntity(rawEntity), 'entity'));
  }

  startMap(key: string): ChURIMapConsumer<TValue> {
    const prevCharge = this.#map.get(key);

    return new URIChargeMapBuilder(
      map => this.#map.set(key, map),
      prevCharge && prevCharge.isMap() ? prevCharge : undefined,
    );
  }

  startList(key: string): ChURIListConsumer<TValue> {
    return new URIChargeListBuilder(list => this.#map.set(key, list));
  }

  startDirective(key: string, rawName: string): ChURIDirectiveConsumer<TValue> {
    return new URIChargeDirectiveBuilder(rawName, directive => this.#map.set(key, directive));
  }

  addSuffix(suffix: string): void {
    this.startMap(suffix).endMap();
  }

  endMap(): URICharge.Map<TValue> {
    const map = new URICharge$Map(this.#map);

    this.#endMap?.(map);

    return map;
  }

}

export class URIChargeListBuilder<in out TValue = ChURIPrimitive>
  implements ChURIListConsumer<TValue, URICharge.List<TValue>> {

  readonly #endList?: (list: URICharge.List<TValue>) => void;
  readonly #list: URICharge.Some<TValue>[];

  constructor(endList?: (list: URICharge.List<TValue>) => void, base?: URICharge.Some<TValue>) {
    this.#endList = endList;
    if (base?.isList()) {
      this.#list = [...base.list()];
    } else {
      this.#list = [];
    }
  }

  add(value: TValue | ChURIPrimitive, type: string): void {
    this.#list.push(new URICharge$Single(value, type));
  }

  addEntity(rawEntity: string): void {
    this.#list.push(new URICharge$Single<TValue>(new ChURIEntity(rawEntity), 'entity'));
  }

  startMap(): ChURIMapConsumer<TValue> {
    return new URIChargeMapBuilder(map => this.#list.push(map));
  }

  startList(): ChURIListConsumer<TValue> {
    return new URIChargeListBuilder(list => this.#list.push(list));
  }

  startDirective(rawName: string): ChURIDirectiveConsumer<TValue> {
    return new URIChargeDirectiveBuilder(rawName, directive => this.#list.push(directive));
  }

  endList(): URICharge.List<TValue> {
    const list = new URICharge$List(this.#list);

    this.#endList?.(list);

    return list;
  }

}

export class URIChargeDirectiveBuilder<in out TValue = ChURIPrimitive>
  implements ChURIDirectiveConsumer<TValue, URICharge.Single<TValue>> {

  readonly #rawName: string;
  readonly #endDirective?: (directive: URICharge.Single<TValue>) => void;
  #value: URIChargeDirective$Value<TValue> = URIChargeDirective$none;

  constructor(rawName: string, endDirective?: (directive: URICharge.Single<TValue>) => void) {
    this.#rawName = rawName;
    this.#endDirective = endDirective;
  }

  add(value: TValue | ChURIPrimitive, type: string): void {
    this.#add(new URICharge$Single(value, type));
  }

  addEntity(rawEntity: string): void {
    this.#value.add(new URICharge$Single<TValue>(new ChURIEntity(rawEntity), 'entity'));
  }

  startMap(): ChURIMapConsumer<TValue> {
    return new URIChargeMapBuilder(map => this.#add(map));
  }

  startList(): ChURIListConsumer<TValue, unknown> {
    return new URIChargeListBuilder(list => this.#add(list));
  }

  startDirective(rawName: string): ChURIDirectiveConsumer<TValue> {
    return new URIChargeDirectiveBuilder(rawName, directive => this.#add(directive));
  }

  endDirective(): URICharge.Single<TValue> {
    const directive = new URICharge$Single(this.#value.toDirective(this.#rawName), 'directive');

    this.#endDirective?.(directive);

    return directive;
  }

  #add(value: URICharge.Some<TValue>): void {
    this.#value = this.#value.add(value);
  }

}

interface URIChargeDirective$Value<out TValue> {
  add(value: URICharge.Some<TValue>): URIChargeDirective$Value<TValue>;
  toDirective(rawName: string): ChURIDirective<URICharge<TValue>>;
}

class URIChargeDirective$None<TValue> implements URIChargeDirective$Value<TValue> {

  add(value: URICharge.Some<TValue>): URIChargeDirective$Single<TValue> {
    return new URIChargeDirective$Single(value);
  }

  toDirective(rawName: string): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, URICharge.none);
  }

}

const URIChargeDirective$none: URIChargeDirective$Value<any> =
  /*#__PURE__*/ new URIChargeDirective$None();

class URIChargeDirective$Single<TValue> implements URIChargeDirective$Value<TValue> {

  readonly #value: URICharge.Some<TValue>;

  constructor(value: URICharge.Some<TValue>) {
    this.#value = value;
  }

  add(value: URICharge.Some<TValue>): URIChargeDirective$List<TValue> {
    return new URIChargeDirective$List([this.#value, value]);
  }

  toDirective(rawName: string): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, this.#value);
  }

}

class URIChargeDirective$List<TValue> implements URIChargeDirective$Value<TValue> {

  readonly #list: URICharge.Some<TValue>[];

  constructor(list: URICharge.Some<TValue>[]) {
    this.#list = list;
  }

  add(value: URICharge.Some<TValue>): this {
    this.#list.push(value);

    return this;
  }

  toDirective(rawName: string): ChURIDirective<URICharge<TValue>> {
    return new ChURIDirective(rawName, new URICharge$List(this.#list));
  }

}
