import {
  ChURIListConsumer,
  ChURIMapConsumer,
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

export class ChURIMapEntryTarget<TValue> implements URIChargeTarget<TValue> {

  readonly #key: string;
  readonly #consumer: ChURIMapConsumer<TValue>;
  readonly #decoder: URIChargeDecoder;
  readonly #formatParser: URIChargeFormatParser<TValue>;

  constructor(
    parent: URIChargeTarget<TValue>,
    key: string,
    consumer: ChURIMapConsumer<TValue>,
    decoder: URIChargeDecoder = parent.decoder,
  ) {
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

  forKey(key: string): ChURIMapEntryTarget<TValue> {
    return new ChURIMapEntryTarget(this, key, this.#consumer);
  }

  set(value: ChURIValue<TValue>, type: string): void {
    this.#consumer.put(this.#key, value, type);
  }

  addSuffix(): void {
    this.#consumer.addSuffix(this.#key);
  }

  startMap(): ChURIMapConsumer<TValue> {
    return this.#consumer.startMap(this.#key);
  }

  startList(): ChURIListConsumer<TValue> {
    return this.#consumer.startList(this.#key);
  }

}

export class ChURIListItemTarget<TValue> implements URIChargeTarget<TValue> {

  readonly #consumer: ChURIListConsumer<TValue>;
  readonly #decoder: URIChargeDecoder;
  readonly #formatParser: URIChargeFormatParser<TValue, unknown>;

  constructor(parent: URIChargeTarget<TValue>, consumer: ChURIListConsumer<TValue>) {
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

  set(value: ChURIValue<TValue>, type: string): void {
    this.#consumer.add(value, type);
  }

  startMap(): ChURIMapConsumer<TValue> {
    return this.#consumer.startMap();
  }

  startList(): ChURIListConsumer<TValue> {
    return this.#consumer.startList();
  }

  endList(): void {
    this.#consumer.endList();
  }

}
