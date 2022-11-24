import { isArray } from '@proc7ts/primitives';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIObject, ChURIPrimitive } from './ch-uri-value.js';
import { URIChargeVisitor } from './uri-charge-visitor.js';

export class ChURIObjectBuilder extends ChURIObjectConsumer {

  static get visitor(): URIChargeVisitor<string | ChURIObject> {
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

  override addPrimitive(key: string, value: ChURIPrimitive, append: boolean): void {
    if (append) {
      const prevValue = this.#object[key];

      if (prevValue == null) {
        // Never called by parser.
        this.#object[key] = [value];
      } else if (isArray(prevValue)) {
        prevValue.push(value);
      } else {
        this.#object[key] = [prevValue, value];
      }
    } else {
      this.#object[key] = value;
    }
  }

  override startObject(key: string, append: boolean): ChURIObjectConsumer {
    return new (this.constructor as typeof ChURIObjectBuilder)(this.addObject(key, append));
  }

  addObject(key: string, append: boolean): ChURIObject {
    const prevValue = this.#object[key];
    let object: ChURIObject;

    if (append) {
      if (prevValue == null) {
        // Never called by parser.
        this.#object[key] = [(object = {})];
      } else if (isArray(prevValue)) {
        object = {};
        prevValue.push(object);
      } else {
        object = {};
        this.#object[key] = [prevValue, object];
      }
    } else if (typeof prevValue === 'object' && !isArray(prevValue)) {
      object = prevValue;
    } else {
      this.#object[key] = object = {};
    }

    return object;
  }

}

class ChURIObjectVisitor implements URIChargeVisitor<string | ChURIObject> {

  visitString(value: string): string | ChURIObject {
    return value;
  }

  visitObject(): [ChURIObjectConsumer, () => ChURIObject] {
    const consumer = new ChURIObjectBuilder();
    const { object } = consumer;

    return [consumer, () => object];
  }

}

const ChURIObjectVisitor$instance = /*#__PURE__*/ new ChURIObjectVisitor();
