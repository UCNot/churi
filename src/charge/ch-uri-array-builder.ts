import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectBuilder } from './ch-uri-object-builder.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIArray, ChURIObject, ChURIValue } from './ch-uri-value.js';

export class ChURIArrayBuilder extends ChURIArrayConsumer {

  readonly #array: ChURIArray;

  constructor(array: ChURIArray = []) {
    super();
    this.#array = array;
  }

  get array(): ChURIArray {
    return this.#array;
  }

  override startObject(): ChURIObjectConsumer {
    return new ChURIObjectBuilder(this.addObject());
  }

  addObject(): ChURIObject {
    const object = {};

    this.addValue(object);

    return object;
  }

  override startArray(): ChURIArrayConsumer {
    return new (this.constructor as typeof ChURIArrayBuilder)(this.addArray());
  }

  addArray(): ChURIArray {
    const array: ChURIArray = [];

    this.addValue(array);

    return array;
  }

  override addValue(value: ChURIValue): void {
    this.#array.push(value);
  }

}
