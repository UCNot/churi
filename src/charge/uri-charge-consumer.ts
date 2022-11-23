import { URIChargeObject } from './uri-charge-value.js';

export interface URIChargeConsumer {
  addBigInt(key: string, value: bigint): void;
  addBoolean(key: string, value: boolean): void;
  addNumber(key: string, value: number): void;
  addString(key: string, value: string): void;
  startObject(key: string): URIChargeConsumer;
  endObject(suffix: string): void;
}

export class DefaultURIChargeConsumer implements URIChargeConsumer {

  readonly #object: URIChargeObject;

  constructor(object: URIChargeObject = {}) {
    this.#object = object;
  }

  get object(): URIChargeObject {
    return this.#object;
  }

  addBigInt(key: string, value: bigint): void {
    this.#object[key] = value;
  }

  addBoolean(key: string, value: boolean): void {
    this.#object[key] = value;
  }

  addNumber(key: string, value: number): void {
    this.#object[key] = value;
  }

  addString(key: string, value: string): void {
    this.#object[key] = value;
  }

  startObject(key: string): URIChargeConsumer {
    const object = {};
    const consumer = new (this.constructor as typeof DefaultURIChargeConsumer)(object);

    this.#object[key] = object;

    return consumer;
  }

  endObject(suffix: string): void {
    if (suffix) {
      this.#object[suffix] = '';
    }
  }

}
