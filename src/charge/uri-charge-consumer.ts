import { isArray } from '@proc7ts/primitives';
import { URIChargeValue } from './uri-charge-value.js';

export abstract class URIChargeConsumer {

  addBigInt(key: string, value: bigint): void {
    this.addSimple(key, value);
  }

  addBoolean(key: string, value: boolean): void {
    this.addSimple(key, value);
  }

  addNumber(key: string, value: number): void {
    this.addSimple(key, value);
  }

  addString(key: string, value: string): void {
    this.addSimple(key, value);
  }

  addSuffix(suffix: string): void {
    this.addBoolean(suffix, true);
  }

  abstract addSimple(key: string, value: URIChargeValue.Simple): void;

  abstract startObject(key: string): URIChargeConsumer;

  endObject(): void {
    // Do nothing.
  }

}

export class DefaultURIChargeConsumer extends URIChargeConsumer {

  readonly #object: URIChargeValue.Object;

  constructor(object: URIChargeValue.Object = {}) {
    super();
    this.#object = object;
  }

  get object(): URIChargeValue.Object {
    return this.#object;
  }

  override addSimple(key: string, value: URIChargeValue.Simple): void {
    const prevValue = this.#object[key];

    if (prevValue == null) {
      this.#object[key] = value;
    } else if (isArray(prevValue)) {
      prevValue.push(value);
    } else {
      this.#object[key] = [prevValue, value];
    }
  }

  override startObject(key: string): URIChargeConsumer {
    return new (this.constructor as typeof DefaultURIChargeConsumer)(this.addObject(key));
  }

  addObject(key: string): URIChargeValue.Object {
    const prevValue = this.#object[key];
    let object: URIChargeValue.Object;

    if (prevValue == null) {
      this.#object[key] = object = {};
    } else if (isArray(prevValue)) {
      const lastElement = prevValue[prevValue.length - 1];

      if (typeof lastElement === 'object') {
        object = lastElement;
      } else {
        object = {};
        prevValue.push(object);
      }
    } else if (typeof prevValue === 'object') {
      object = prevValue;
    } else {
      object = {};
      this.#object[key] = [prevValue, object];
    }

    return object;
  }

}
