import {
  ChURIDirectiveConsumer,
  ChURIListConsumer,
  ChURIMapConsumer,
  ChURIValueConsumer,
} from '../ch-uri-value-consumer.js';
import { ChURIValue } from '../ch-uri-value.js';
import { ChURIExtParser } from './ch-uri-ext-parser.js';
import { ChURIValueDecoder } from './ch-uri-value-decoder.js';

export interface URIChargeTarget<in out TValue, out TCharge = unknown> {
  readonly decoder: ChURIValueDecoder;
  readonly consumer: ChURIValueConsumer<TValue, TCharge>;
  readonly ext: ChURIExtParser<TValue, TCharge>;

  decode(input: string): TCharge;
}

export class ChURIMapEntryTarget<TValue> implements URIChargeTarget<TValue> {

  readonly #key: string;
  readonly #consumer: ChURIMapConsumer<TValue>;
  readonly #decoder: ChURIValueDecoder;
  readonly #ext: ChURIExtParser<TValue>;

  constructor(
    parent: URIChargeTarget<TValue>,
    key: string,
    consumer: ChURIMapConsumer<TValue>,
    decoder: ChURIValueDecoder = parent.decoder,
  ) {
    this.#key = key;
    this.#consumer = consumer;
    this.#decoder = decoder;
    this.#ext = parent.ext;
  }

  get decoder(): ChURIValueDecoder {
    return this.#decoder;
  }

  get consumer(): ChURIValueConsumer<TValue> {
    return this;
  }

  get ext(): ChURIExtParser<TValue> {
    return this.#ext;
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

  setEntity(rawEntity: string): void {
    this.#consumer.putEntity(this.#key, rawEntity);
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

  startDirective(rawName: string): ChURIDirectiveConsumer<TValue> {
    return this.#consumer.startDirective(this.#key, rawName);
  }

}

abstract class ChURIItemTarget<
  TValue,
  TConsumer extends ChURIListConsumer<TValue> | ChURIDirectiveConsumer<TValue>,
> implements URIChargeTarget<TValue> {

  readonly #decoder: ChURIValueDecoder;
  readonly #ext: ChURIExtParser<TValue, unknown>;

  constructor(parent: URIChargeTarget<TValue>, protected readonly itemConsumer: TConsumer) {
    this.#decoder = parent.decoder;
    this.#ext = parent.ext;
  }

  get consumer(): this {
    return this;
  }

  get decoder(): ChURIValueDecoder {
    return this.#decoder;
  }

  get ext(): ChURIExtParser<TValue> {
    return this.#ext;
  }

  decode(input: string): unknown {
    return this.#decoder.decodeValue(this, input);
  }

  set(value: ChURIValue<TValue>, type: string): void {
    this.itemConsumer.add(value, type);
  }

  setEntity(rawEntity: string): void {
    this.itemConsumer.addEntity(rawEntity);
  }

  startMap(): ChURIMapConsumer<TValue> {
    return this.itemConsumer.startMap();
  }

  startList(): ChURIListConsumer<TValue> {
    return this.itemConsumer.startList();
  }

  startDirective(rawName: string): ChURIDirectiveConsumer<TValue> {
    return this.itemConsumer.startDirective(rawName);
  }

}

export class ChURIListItemTarget<TValue> extends ChURIItemTarget<
  TValue,
  ChURIListConsumer<TValue>
> {

  endList(): void {
    this.itemConsumer.endList();
  }

}

export class ChURIDirectiveArgsTarget<TValue> extends ChURIItemTarget<
  TValue,
  ChURIDirectiveConsumer<TValue>
> {}
