import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIValue } from './ch-uri-value.js';

export abstract class ChURIValueConsumer<in out TValue = never, out TCharge = unknown> {

  abstract set(value: ChURIValue<TValue>, type: string): TCharge;

  abstract startObject(): ChURIObjectConsumer<TValue, TCharge>;

  abstract startArray(): ChURIArrayConsumer<TValue, TCharge>;

  recharge<TRecharge>(
    recharge: <T extends TCharge>(charge: T) => TRecharge,
  ): ChURIValueConsumer<TValue, TRecharge> {
    return new RechargingURIValueConsumer(this as ChURIValueConsumer<TValue, any>, recharge);
  }

}

export class ProxyChURIValueConsumer<
  in out TValue = never,
  out TCharge = unknown,
> extends ChURIValueConsumer<TValue, TCharge> {

  #consumer: ChURIValueConsumer<TValue, TCharge>;

  constructor(consumer: ChURIValueConsumer<TValue, TCharge>) {
    super();

    this.#consumer = consumer;
  }

  override set(value: ChURIValue<TValue>, type: string): TCharge {
    return this.#consumer.set(value, type);
  }

  override startObject(): ChURIObjectConsumer<TValue, TCharge> {
    return this.#consumer.startObject();
  }

  override startArray(): ChURIArrayConsumer<TValue, TCharge> {
    return this.#consumer.startArray();
  }

}

class RechargingURIValueConsumer<in out TValue, out TCharge> extends ProxyChURIValueConsumer<
  TValue,
  TCharge
> {

  #recharge: <T extends TCharge>(charge: T) => TCharge;

  constructor(
    consumer: ChURIValueConsumer<TValue, TCharge>,
    recharge: <T extends TCharge>(charge: T) => TCharge,
  ) {
    super(consumer);
    this.#recharge = recharge;
  }

  override set(value: ChURIValue<TValue>, type: string): TCharge {
    return this.#recharge(super.set(value, type));
  }

  override startObject(): ChURIObjectConsumer<TValue, TCharge> {
    return super.startObject().recharge(this.#recharge);
  }

  override startArray(): ChURIArrayConsumer<TValue, TCharge> {
    return super.startArray().recharge(this.#recharge);
  }

}
