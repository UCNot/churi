import { isArray } from '@proc7ts/primitives';
import { URIChargeValue } from './uri-charge-value.js';

export abstract class URIChargeConsumer {

  addBigInt(key: string, value: bigint, append: boolean): void {
    this.addSimple(key, value, append);
  }

  addBoolean(key: string, value: boolean, append: boolean): void {
    this.addSimple(key, value, append);
  }

  addNumber(key: string, value: number, append: boolean): void {
    this.addSimple(key, value, append);
  }

  addString(key: string, value: string, append: boolean): void {
    this.addSimple(key, value, append);
  }

  addSuffix(suffix: string): void {
    this.addBoolean(suffix, true, false);
  }

  abstract addSimple(key: string, value: URIChargeValue.Simple, append: boolean): void;

  abstract startObject(key: string, append: boolean): URIChargeConsumer;

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

  override addSimple(key: string, value: URIChargeValue.Simple, append: boolean): void {
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

  override startObject(key: string, append: boolean): URIChargeConsumer {
    return new (this.constructor as typeof DefaultURIChargeConsumer)(this.addObject(key, append));
  }

  addObject(key: string, append: boolean): URIChargeValue.Object {
    const prevValue = this.#object[key];
    let object: URIChargeValue.Object;

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
