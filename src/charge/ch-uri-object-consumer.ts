import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIValue } from './ch-uri-value.js';

export abstract class ChURIObjectConsumer<in out TValue = never, out TCharge = unknown> {

  abstract put(key: string, value: ChURIValue<TValue>, type: string): void;

  abstract startObject(key: string): ChURIObjectConsumer<TValue>;

  abstract startArray(key: string): ChURIArrayConsumer<TValue>;

  addSuffix(suffix: string): void {
    this.startObject(suffix).endObject();
  }

  abstract endObject(): TCharge;

  recharge<TRecharge>(
    recharge: <T extends TCharge>(charge: T) => TRecharge,
  ): ChURIObjectConsumer<TValue, TRecharge> {
    return new RechargingURIObjectConsumer(this as ChURIObjectConsumer<TValue, any>, recharge);
  }

}

export class ProxyChURIObjectConsumer<
  in out TValue = never,
  out TCharge = unknown,
> extends ChURIObjectConsumer<TValue, TCharge> {

  readonly #consumer: ChURIObjectConsumer<TValue, TCharge>;

  constructor(consumer: ChURIObjectConsumer<TValue, TCharge>) {
    super();
    this.#consumer = consumer;
  }

  override put(key: string, value: ChURIValue<TValue>, type: string): void {
    this.#consumer.put(key, value, type);
  }

  override startObject(key: string): ChURIObjectConsumer<TValue, unknown> {
    return this.#consumer.startObject(key);
  }

  override startArray(key: string): ChURIArrayConsumer<TValue, unknown> {
    return this.#consumer.startArray(key);
  }

  override endObject(): TCharge {
    return this.#consumer.endObject();
  }

}

class RechargingURIObjectConsumer<in out TValue, out TCharge> extends ProxyChURIObjectConsumer<
  TValue,
  TCharge
> {

  readonly #recharge: <T extends TCharge>(charge: T) => TCharge;

  constructor(
    consumer: ChURIObjectConsumer<TValue, TCharge>,
    recharge: (charge: TCharge) => TCharge,
  ) {
    super(consumer);
    this.#recharge = recharge;
  }

  override endObject(): TCharge {
    return this.#recharge(super.endObject());
  }

}
