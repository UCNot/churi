import { ChURIArrayConsumer } from '../ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from '../ch-uri-object-consumer.js';
import { ChURIValueConsumer } from '../ch-uri-value-consumer.js';
import { ChURIValue } from '../ch-uri-value.js';

export type URIChargeTarget<TValue, TCharge = unknown> = ChURIValueConsumer<TValue, TCharge>;

export class ChURIPropertyTarget<TValue>
  extends ChURIValueConsumer<TValue>
  implements URIChargeTarget<TValue> {

  readonly #key: string;
  readonly #consumer: ChURIObjectConsumer<TValue>;

  constructor(key: string, consumer: ChURIObjectConsumer<TValue>) {
    super();
    this.#key = key;
    this.#consumer = consumer;
  }

  forKey(key: string): ChURIPropertyTarget<TValue> {
    return new ChURIPropertyTarget(key, this.#consumer);
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

  constructor(consumer: ChURIArrayConsumer<TValue>) {
    super();
    this.#consumer = consumer;
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
