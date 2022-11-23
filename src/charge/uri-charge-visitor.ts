import { DefaultURIChargeConsumer, URIChargeConsumer } from './uri-charge-consumer.js';
import { URIChargeValue } from './uri-charge-value.js';

export interface URIChargeVisitor<T> {
  visitString(value: string): T;
  visitObject(): [consumer: URIChargeConsumer, endCharge: () => T];
}

export class DefaultURIChargeVisitor implements URIChargeVisitor<string | URIChargeValue.Object> {

  visitString(value: string): string | URIChargeValue.Object {
    return value;
  }

  visitObject(): [URIChargeConsumer, () => URIChargeValue.Object] {
    const consumer = new DefaultURIChargeConsumer();
    const { object } = consumer;

    return [consumer, () => object];
  }

}
