import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectBuilder } from './ch-uri-object-builder.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIArray, ChURIObject, ChURIPrimitive, ChURIValue } from './ch-uri-value.js';

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
