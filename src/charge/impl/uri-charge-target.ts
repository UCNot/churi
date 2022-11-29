import {
  ChURIArrayConsumer,
  ChURIObjectConsumer,
  ChURIValueConsumer,
} from '../ch-uri-value-consumer.js';
import { ChURIValue } from '../ch-uri-value.js';
import { URIChargeDecoder } from './uri-charge-decoder.js';
import { URIChargeFormatParser } from './uri-charge-format-parser.js';

export interface URIChargeTarget<in out TValue, out TCharge = unknown> {
  readonly decoder: URIChargeDecoder;
  readonly consumer: ChURIValueConsumer<TValue, TCharge>;
  readonly formatParser: URIChargeFormatParser<TValue, TCharge>;

  decode(input: string): TCharge;
}

export class ChURIPropertyTarget<TValue>
  extends ChURIValueConsumer<TValue>
  implements URIChargeTarget<TValue> {

  readonly #key: string;
  readonly #consumer: ChURIObjectConsumer<TValue>;
  readonly #decoder: URIChargeDecoder;
  readonly #formatParser: URIChargeFormatParser<TValue>;

  constructor(
    parent: URIChargeTarget<TValue>,
    key: string,
    consumer: ChURIObjectConsumer<TValue>,
    decoder: URIChargeDecoder = parent.decoder,
  ) {
    super();
    this.#key = key;
    this.#consumer = consumer;
    this.#decoder = decoder;
    this.#formatParser = parent.formatParser;
  }

  get decoder(): URIChargeDecoder {
    return this.#decoder;
  }

  get consumer(): ChURIValueConsumer<TValue> {
    return this;
  }

  get formatParser(): URIChargeFormatParser<TValue> {
    return this.#formatParser;
  }

  decode(input: string): unknown {
    return this.#decoder.decodeValue(this, input);
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
  readonly #decoder: URIChargeDecoder;
  readonly #formatParser: URIChargeFormatParser<TValue, unknown>;

  constructor(parent: URIChargeTarget<TValue>, consumer: ChURIArrayConsumer<TValue>) {
    super();
    this.#consumer = consumer;
    this.#decoder = parent.decoder;
    this.#formatParser = parent.formatParser;
  }

  get consumer(): ChURIValueConsumer<TValue> {
    return this;
  }

  get decoder(): URIChargeDecoder {
    return this.#decoder;
  }

  get formatParser(): URIChargeFormatParser<TValue> {
    return this.#formatParser;
  }

  decode(input: string): unknown {
    return this.#decoder.decodeValue(this, input);
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
