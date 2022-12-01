import {
  ChURIDirectiveConsumer,
  ChURIListConsumer,
  ChURIMapConsumer,
  ChURIValueConsumer,
} from './ch-uri-value-consumer.js';
import {
  ChURIDirective,
  ChURIEntity,
  ChURIList,
  ChURIMap,
  ChURIPrimitive,
  ChURIValue,
} from './ch-uri-value.js';

export class ChURIValueBuilder<in out TValue = ChURIPrimitive>
  implements ChURIValueConsumer<TValue, ChURIValue<TValue>> {

  set(value: ChURIValue<TValue>, _type: string): ChURIValue<TValue> {
    return value;
  }

  setEntity(rawEntity: string): ChURIValue<TValue> {
    return this.set(new ChURIEntity(rawEntity), 'entity');
  }

  startMap(): ChURIMapConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIMapBuilder<TValue>();
  }

  startList(): ChURIListConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIListBuilder<TValue>();
  }

  startDirective(rawName: string): ChURIDirectiveConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIDirectiveBuilder(rawName);
  }

}

export class ChURIMapBuilder<in out TValue = ChURIPrimitive>
  implements ChURIMapConsumer<TValue, ChURIMap<TValue>> {

  readonly #map: ChURIMap<TValue>;
  readonly #endMap?: (map: ChURIMap<TValue>) => void;

  constructor(endMap?: (map: ChURIMap<TValue>) => void, map: ChURIMap<TValue> = {}) {
    this.#map = map;
    this.#endMap = endMap;
  }

  put(key: string, value: ChURIValue<TValue>, _type: string): void {
    this.#map[key] = value;
  }

  putEntity(key: string, rawEntity: string): void {
    this.put(key, new ChURIEntity(rawEntity), 'entry');
  }

  startMap(key: string): ChURIMapConsumer<TValue> {
    return new ChURIMapBuilder(undefined, this.addMap(key));
  }

  addSuffix(suffix: string): void {
    this.startMap(suffix).endMap();
  }

  addMap(key: string): ChURIMap<TValue> {
    const prevValue = this.#map[key];
    let map: ChURIMap<TValue>;

    if (prevValue && typeof prevValue === 'object' && !Array.isArray(prevValue)) {
      map = prevValue as ChURIMap<TValue>;
    } else {
      this.put(key, (map = {}), 'map');
    }

    return map;
  }

  startList(key: string): ChURIListConsumer<TValue> {
    return new ChURIListBuilder(undefined, this.addList(key));
  }

  addList(key: string): ChURIList<TValue> {
    const prevValue = this.#map[key];
    let list: ChURIList<TValue>;

    if (Array.isArray(prevValue)) {
      list = prevValue;
    } else {
      this.put(key, (list = prevValue != null ? [prevValue] : []), 'list');
    }

    return list;
  }

  startDirective(key: string, rawName: string): ChURIDirectiveConsumer<TValue> {
    return new ChURIDirectiveBuilder(rawName, directive => this.putDirective(key, directive));
  }

  putDirective(key: string, directive: ChURIDirective<ChURIValue<TValue>>): void {
    this.put(key, directive, 'directive');
  }

  endMap(): ChURIMap<TValue> {
    this.#endMap?.(this.#map);

    return this.#map;
  }

}

export abstract class ChURIItemsBuilder<in out TValue = ChURIPrimitive> {

  abstract add(value: ChURIValue<TValue>, _type: string): void;

  addEntity(rawEntity: string): void {
    this.add(new ChURIEntity(rawEntity), 'entity');
  }

  startMap(): ChURIMapConsumer<TValue> {
    return new ChURIMapBuilder<TValue>(map => this.addMap(map));
  }

  addMap(map: ChURIMap<TValue>): void {
    this.add(map, 'map');
  }

  startList(): ChURIListConsumer<TValue> {
    return new ChURIListBuilder(list => this.addList(list));
  }

  addList(list: ChURIList<TValue>): void {
    this.add(list, 'list');
  }

  startDirective(rawName: string): ChURIDirectiveBuilder<TValue> {
    return new ChURIDirectiveBuilder(rawName, directive => this.addDirective(directive));
  }

  addDirective(directive: ChURIDirective<ChURIValue<TValue>>): void {
    this.add(directive, 'directive');
  }

}

export class ChURIListBuilder<in out TValue = ChURIPrimitive>
  extends ChURIItemsBuilder<TValue>
  implements ChURIListConsumer<TValue, ChURIList<TValue>> {

  readonly #list: ChURIList<TValue>;
  readonly #endList?: (list: ChURIList<TValue>) => void;

  constructor(endList?: (list: ChURIList<TValue>) => void, list: ChURIList<TValue> = []) {
    super();
    this.#list = list;
    this.#endList = endList;
  }

  add(value: ChURIValue<TValue>, _type: string): void {
    this.#list.push(value);
  }

  endList(): ChURIList<TValue> {
    this.#endList?.(this.#list);

    return this.#list;
  }

}

export class ChURIDirectiveBuilder<in out TValue = ChURIPrimitive>
  extends ChURIItemsBuilder<TValue>
  implements ChURIDirectiveConsumer<TValue, ChURIDirective<ChURIValue<TValue>>> {

  readonly #rawName: string;
  readonly #endDirective?: (directive: ChURIDirective<ChURIValue<TValue>>) => void;
  #value: ChURIDirective$Value<TValue> = ChURIDirective$none;

  constructor(
    rawName: string,
    endDirective?: (directive: ChURIDirective<ChURIValue<TValue>>) => void,
  ) {
    super();
    this.#rawName = rawName;
    this.#endDirective = endDirective;
  }

  add(value: ChURIValue<TValue>, _type: string): void {
    this.#value = this.#value.add(value);
  }

  endDirective(): ChURIDirective<ChURIValue<TValue>> {
    const directive = this.#value.toDirective(this.#rawName);

    this.#endDirective?.(directive);

    return directive;
  }

}

interface ChURIDirective$Value<TValue> {
  add(value: ChURIValue<TValue>): ChURIDirective$Value<TValue>;
  toDirective(rawName: string): ChURIDirective<ChURIValue<TValue>>;
}

class ChURIDirective$None<TValue> implements ChURIDirective$Value<TValue> {

  add(value: ChURIValue<TValue>): ChURIDirective$Single<TValue> {
    return new ChURIDirective$Single(value);
  }

  toDirective(rawName: string): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, {});
  }

}

const ChURIDirective$none: ChURIDirective$Value<any> = /*#__PURE__*/ new ChURIDirective$None();

class ChURIDirective$Single<TValue> implements ChURIDirective$Value<TValue> {

  readonly #value: ChURIValue<TValue>;

  constructor(value: ChURIValue<TValue>) {
    this.#value = value;
  }

  add(value: ChURIValue<TValue>): ChURIDirective$List<TValue> {
    return new ChURIDirective$List([this.#value, value]);
  }

  toDirective(rawName: string): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, this.#value);
  }

}

class ChURIDirective$List<TValue> implements ChURIDirective$Value<TValue> {

  readonly #list: ChURIList<TValue>;

  constructor(list: ChURIList<TValue>) {
    this.#list = list;
  }

  add(value: ChURIValue<TValue>): this {
    this.#list.push(value);

    return this;
  }

  toDirective(rawName: string): ChURIDirective<ChURIValue<TValue>> {
    return new ChURIDirective(rawName, this.#list);
  }

}
