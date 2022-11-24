import { isArray } from '@proc7ts/primitives';
import { ChURIArrayBuilder } from './ch-uri-array-builder.js';
import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIArray, ChURIObject, ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { URIChargeVisitor } from './uri-charge-visitor.js';

export class ChURIObjectBuilder extends ChURIObjectConsumer {

  static get visitor(): URIChargeVisitor<string | ChURIObject | ChURIArray> {
    return ChURIObjectVisitor$instance;
  }

  readonly #object: ChURIObject;

  constructor(object: ChURIObject = {}) {
    super();
    this.#object = object;
  }

  get object(): ChURIObject {
    return this.#object;
  }

  override addPrimitive(key: string, value: ChURIPrimitive): void {
    this.addValue(key, value);
  }

  override startObject(key: string): ChURIObjectConsumer {
    return new (this.constructor as typeof ChURIObjectBuilder)(this.addObject(key));
  }

  addObject(key: string): ChURIObject {
    const prevValue = this.#object[key];
    let object: ChURIObject;

    if (typeof prevValue === 'object' && !isArray(prevValue)) {
      object = prevValue;
    } else {
      this.addValue(key, (object = {}));
    }

    return object;
  }

  override startArray(key: string): ChURIArrayConsumer {
    return new ChURIArrayBuilder(this.addArray(key));
  }

  addArray(key: string): ChURIArray {
    const prevValue = this.#object[key];
    let array: ChURIArray;

    if (isArray(prevValue)) {
      array = prevValue;
    } else {
      this.addValue(key, (array = prevValue != null ? [prevValue] : []));
    }

    return array;
  }

  addValue(key: string, value: ChURIValue): void {
    this.#object[key] = value;
  }

}

class ChURIObjectVisitor implements URIChargeVisitor<string | ChURIObject | ChURIArray> {

  visitString(value: string): string | ChURIObject {
    return value;
  }

  visitObject(): [ChURIObjectConsumer, () => ChURIObject] {
    const builder = new ChURIObjectBuilder();

    return [builder, () => builder.object];
  }

  visitArray(): [ChURIArrayConsumer, () => ChURIArray] {
    const builder = new ChURIArrayBuilder();

    return [builder, () => builder.array];
  }

}

const ChURIObjectVisitor$instance = /*#__PURE__*/ new ChURIObjectVisitor();
