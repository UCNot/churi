import { isArray } from '@proc7ts/primitives';
import {
  ChURIListConsumer,
  ChURIMapConsumer,
  ChURIValueConsumer,
} from './ch-uri-value-consumer.js';
import { ChURIList, ChURIMap, ChURIPrimitive, ChURIValue } from './ch-uri-value.js';

export class ChURIValueBuilder<in out TValue = ChURIPrimitive>
  implements ChURIValueConsumer<TValue, ChURIValue<TValue>> {

  set(value: ChURIValue<TValue>, _type: string): ChURIValue<TValue> {
    return value;
  }

  startMap(): ChURIMapConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIMapBuilder<TValue>();
  }

  startList(): ChURIListConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIListBuilder<TValue>();
  }

}

export class ChURIMapBuilder<in out TValue = ChURIPrimitive>
  implements ChURIMapConsumer<TValue, ChURIMap<TValue>> {

  readonly #map: ChURIMap<TValue>;

  constructor(map: ChURIMap<TValue> = {}) {
    this.#map = map;
  }

  get map(): ChURIMap<TValue> {
    return this.#map;
  }

  put(key: string, value: ChURIValue<TValue>, _type: string): void {
    this.#map[key] = value;
  }

  startMap(key: string): ChURIMapConsumer<TValue> {
    return new (this.constructor as typeof ChURIMapBuilder<TValue>)(this.addMap(key));
  }

  addSuffix(suffix: string): void {
    this.startMap(suffix).endMap();
  }

  addMap(key: string): ChURIMap<TValue> {
    const prevValue = this.#map[key];
    let map: ChURIMap<TValue>;

    if (prevValue && typeof prevValue === 'object' && !isArray(prevValue)) {
      map = prevValue as ChURIMap<TValue>;
    } else {
      this.put(key, (map = {}), 'map');
    }

    return map;
  }

  startList(key: string): ChURIListConsumer<TValue> {
    return new ChURIListBuilder(this.addList(key));
  }

  addList(key: string): ChURIList<TValue> {
    const prevValue = this.#map[key];
    let list: ChURIList<TValue>;

    if (isArray(prevValue)) {
      list = prevValue;
    } else {
      this.put(key, (list = prevValue != null ? [prevValue] : []), 'list');
    }

    return list;
  }

  endMap(): ChURIMap<TValue> {
    return this.map;
  }

}

export class ChURIListBuilder<in out TValue = ChURIPrimitive>
  implements ChURIListConsumer<TValue, ChURIList<TValue>> {

  readonly #list: ChURIList<TValue>;

  constructor(list: ChURIList<TValue> = []) {
    this.#list = list;
  }

  get list(): ChURIList<TValue> {
    return this.#list;
  }

  add(value: ChURIValue<TValue>, _type: string): void {
    this.#list.push(value);
  }

  startMap(): ChURIMapConsumer<TValue> {
    return new ChURIMapBuilder(this.addMap());
  }

  addMap(): ChURIMap<TValue> {
    const map = {};

    this.add(map, 'map');

    return map;
  }

  startList(): ChURIListConsumer<TValue> {
    return new (this.constructor as typeof ChURIListBuilder<TValue>)(this.addList());
  }

  addList(): ChURIList<TValue> {
    const list: ChURIList<TValue> = [];

    this.add(list, 'list');

    return list;
  }

  endList(): ChURIList<TValue> {
    return this.list;
  }

}
