import { isArray } from '@proc7ts/primitives';
import { ChURIArrayBuilder } from './ch-uri-array-builder.js';
import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIArray, ChURIObject, ChURIValue } from './ch-uri-value.js';

export class ChURIObjectBuilder<in out TValue = never> extends ChURIObjectConsumer<
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
