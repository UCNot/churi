import { isArray } from '@proc7ts/primitives';
import {
  ChURIArrayConsumer,
  ChURIObjectConsumer,
  ChURIValueConsumer,
} from './ch-uri-value-consumer.js';
import { ChURIArray, ChURIObject, ChURIPrimitive, ChURIValue } from './ch-uri-value.js';

export class ChURIValueBuilder<in out TValue = ChURIPrimitive> extends ChURIValueConsumer<
  TValue,
  ChURIValue<TValue>
> {

  override set(value: ChURIValue<TValue>, _type: string): ChURIValue<TValue> {
    return value;
  }

  override startObject(): ChURIObjectConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIObjectBuilder<TValue>();
  }

  override startArray(): ChURIArrayConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIArrayBuilder<TValue>();
  }

}

export class ChURIObjectBuilder<in out TValue = ChURIPrimitive> extends ChURIObjectConsumer<
  TValue,
  ChURIObject<TValue>
> {

  readonly #object: ChURIObject<TValue>;

  constructor(object: ChURIObject<TValue> = {}) {
    super();
    this.#object = object;
  }

  get object(): ChURIObject<TValue> {
    return this.#object;
  }

  override put(key: string, value: ChURIValue<TValue>, _type: string): void {
    this.#object[key] = value;
  }

  override startObject(key: string): ChURIObjectConsumer<TValue> {
    return new (this.constructor as typeof ChURIObjectBuilder<TValue>)(this.addObject(key));
  }

  addObject(key: string): ChURIObject<TValue> {
    const prevValue = this.#object[key];
    let object: ChURIObject<TValue>;

    if (prevValue && typeof prevValue === 'object' && !isArray(prevValue)) {
      object = prevValue as ChURIObject<TValue>;
    } else {
      this.put(key, (object = {}), 'object');
    }

    return object;
  }

  override startArray(key: string): ChURIArrayConsumer<TValue> {
    return new ChURIArrayBuilder(this.addArray(key));
  }

  addArray(key: string): ChURIArray<TValue> {
    const prevValue = this.#object[key];
    let array: ChURIArray<TValue>;

    if (isArray(prevValue)) {
      array = prevValue;
    } else {
      this.put(key, (array = prevValue != null ? [prevValue] : []), 'array');
    }

    return array;
  }

  override endObject(): ChURIObject<TValue> {
    return this.object;
  }

}

export class ChURIArrayBuilder<in out TValue = ChURIPrimitive> extends ChURIArrayConsumer<
  TValue,
  ChURIArray<TValue>
> {

  readonly #array: ChURIArray<TValue>;

  constructor(array: ChURIArray<TValue> = []) {
    super();
    this.#array = array;
  }

  get array(): ChURIArray<TValue> {
    return this.#array;
  }

  override add(value: ChURIValue<TValue>, _type: string): void {
    this.#array.push(value);
  }

  override startObject(): ChURIObjectConsumer<TValue> {
    return new ChURIObjectBuilder(this.addObject());
  }

  addObject(): ChURIObject<TValue> {
    const object = {};

    this.add(object, 'object');

    return object;
  }

  override startArray(): ChURIArrayConsumer<TValue> {
    return new (this.constructor as typeof ChURIArrayBuilder<TValue>)(this.addArray());
  }

  addArray(): ChURIArray<TValue> {
    const array: ChURIArray<TValue> = [];

    this.add(array, 'array');

    return array;
  }

  override endArray(): ChURIArray<TValue> {
    return this.array;
  }

}
