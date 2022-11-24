import { isArray } from '@proc7ts/primitives';
import { URIChargeValue } from './uri-charge-value.js';

export interface URIChargeConsumer {
  addBigInt(key: string, value: bigint): void;
  addBoolean(key: string, value: boolean): void;
  addNumber(key: string, value: number): void;
  addString(key: string, value: string): void;
  addSuffix(suffix: string): void;
  startObject(key: string): URIChargeConsumer;
  endObject(): void;
}

export class DefaultURIChargeConsumer implements URIChargeConsumer {

  readonly #object: URIChargeValue.Object;

  constructor(object: URIChargeValue.Object = {}) {
    this.#object = object;
  }

  get object(): URIChargeValue.Object {
    return this.#object;
  }

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

  startObject(key: string): URIChargeConsumer {
    return new (this.constructor as typeof DefaultURIChargeConsumer)(this.addObject(key));
  }

  addSimple(key: string, value: bigint | boolean | number | string): void {
    const prevValue = this.#object[key];

    if (prevValue == null) {
      this.#object[key] = value;
    } else if (isArray(prevValue)) {
      prevValue.push(value);
    } else {
      this.#object[key] = [prevValue, value];
    }
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

  endObject(): void {
    // Do nothing.
  }

}
