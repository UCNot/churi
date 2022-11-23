import { valueProvider } from '@proc7ts/primitives';
import { URIChargeParser } from './uri-charge-parser.js';
import { URIChargeObject } from './uri-charge-value.js';

export class URIChargeParser$Default implements URIChargeParser<string | URIChargeObject> {

  parseString(input: string): string | URIChargeObject {
    return decodeURIComponent(input);
  }

  parseObject(): [URIChargeParser.Consumer, () => URIChargeObject] {
    const object = {};
    const consumer = new URIChargeParser$Consumer$Default(object);

    return [consumer, valueProvider(object)];
  }

}

class URIChargeParser$Consumer$Default implements URIChargeParser.Consumer {

  readonly #object: URIChargeObject;

  constructor(object: URIChargeObject) {
    this.#object = object;
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

  startObject(key: string): URIChargeParser.Consumer {
    const object = {};
    const consumer = new URIChargeParser$Consumer$Default(object);

    this.#object[key] = object;

    return consumer;
  }

  endObject(suffix: string): void {
    if (suffix) {
      this.#object[suffix] = '';
    }
  }

}
