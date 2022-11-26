import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIValue } from './ch-uri-value.js';

export abstract class ChURIArrayConsumer<in out TValue = never, out TCharge = unknown> {

  abstract add(value: ChURIValue<TValue>, type: string): void;

  abstract startObject(): ChURIObjectConsumer<TValue>;

  abstract startArray(): ChURIArrayConsumer<TValue>;

  abstract endArray(): TCharge;

  recharge<TRecharge>(
    recharge: <T extends TCharge>(charge: T) => TRecharge,
  ): ChURIArrayConsumer<TValue, TRecharge> {
    return new RechargingURIArrayConsumer(this as ChURIArrayConsumer<TValue, any>, recharge);
  }

}

export class ProxyChURIArrayConsumer<
  in out TValue = never,
  out TCharge = unknown,
> extends ChURIArrayConsumer<TValue, TCharge> {

  readonly #consumer: ChURIArrayConsumer<TValue, TCharge>;

  constructor(consumer: ChURIArrayConsumer<TValue, TCharge>) {
    super();
    this.#consumer = consumer;
  }

  override add(value: ChURIValue<TValue>, type: string): void {
    this.#consumer.add(value, type);
  }

  override startObject(): ChURIObjectConsumer<TValue, unknown> {
    return this.#consumer.startObject();
  }

  override startArray(): ChURIArrayConsumer<TValue, unknown> {
    return this.#consumer.startArray();
  }

  override endArray(): TCharge {
    return this.#consumer.endArray();
  }

}

class RechargingURIArrayConsumer<in out TValue, out TCharge> extends ProxyChURIArrayConsumer<
  TValue,
  TCharge
> {

  #recharge: <T extends TCharge>(charge: T) => TCharge;

  constructor(
    consumer: ChURIArrayConsumer<TValue, TCharge>,
    recharge: <T extends TCharge>(charge: T) => TCharge,
  ) {
    super(consumer);
    this.#recharge = recharge;
  }

  override endArray(): TCharge {
    return this.#recharge(super.endArray());
  }

}
