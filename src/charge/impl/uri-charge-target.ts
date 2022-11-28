import { ChURIArrayConsumer } from '../ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from '../ch-uri-object-consumer.js';
import { ChURIValueConsumer } from '../ch-uri-value-consumer.js';
import { ChURIValue } from '../ch-uri-value.js';
import { URIChargeFormatParser } from './uri-charge-format-parser.js';

export interface URIChargeTarget<TValue, TCharge = unknown> {
  readonly consumer: ChURIValueConsumer<TValue, TCharge>;
  readonly formatParser: URIChargeFormatParser<TValue, TCharge>;
}

export class ChURIPropertyTarget<TValue>
  extends ChURIValueConsumer<TValue>
  implements URIChargeTarget<TValue> {

  readonly #key: string;
  readonly #consumer: ChURIObjectConsumer<TValue>;
  readonly #formatParser: URIChargeFormatParser<TValue>;

  constructor(parent: URIChargeTarget<TValue>, key: string, consumer: ChURIObjectConsumer<TValue>) {
    super();
    this.#key = key;
    this.#consumer = consumer;
    this.#formatParser = parent.formatParser;
  }

  get consumer(): ChURIValueConsumer<TValue> {
    return this;
  }

  get formatParser(): URIChargeFormatParser<TValue> {
    return this.#formatParser;
  }

  forKey(key: string): ChURIPropertyTarget<TValue> {
    return new ChURIPropertyTarget(this, key, this.#consumer);
  }

  override set(value: ChURIValue<TValue>, type: string): void {
    this.#consumer.put(this.#key, value, type);
  }

  addSuffix(): void {
    this.#consumer.addSuffix(this.#key);
  }

  override startObject(): ChURIObjectConsumer<TValue> {
    return this.#consumer.startObject(this.#key);
  }

  override startArray(): ChURIArrayConsumer<TValue> {
    return this.#consumer.startArray(this.#key);
  }

}

export class ChURIElementTarget<TValue>
  extends ChURIValueConsumer<TValue>
  implements URIChargeTarget<TValue> {

  readonly #consumer: ChURIArrayConsumer<TValue>;
  readonly #formatParser: URIChargeFormatParser<TValue, unknown>;

  constructor(parent: URIChargeTarget<TValue>, consumer: ChURIArrayConsumer<TValue>) {
    super();
    this.#consumer = consumer;
    this.#formatParser = parent.formatParser;
  }

  get consumer(): ChURIValueConsumer<TValue> {
    return this;
  }

  get formatParser(): URIChargeFormatParser<TValue> {
    return this.#formatParser;
  }

  override set(value: ChURIValue<TValue>, type: string): void {
    this.#consumer.add(value, type);
  }

  override startObject(): ChURIObjectConsumer<TValue> {
    return this.#consumer.startObject();
  }

  override startArray(): ChURIArrayConsumer<TValue> {
    return this.#consumer.startArray();
  }

  endArray(): void {
    this.#consumer.endArray();
  }

}
