import { DefaultURIChargeConsumer, URIChargeConsumer } from './uri-charge-consumer.js';
import { URIChargeObject } from './uri-charge-value.js';

export interface URIChargeVisitor<T> {
  visitString(input: string): T;
  visitObject(): [consumer: URIChargeConsumer, endCharge: () => T];
}

export class DefaultURIChargeVisitor implements URIChargeVisitor<string | URIChargeObject> {

  visitString(input: string): string | URIChargeObject {
    return decodeURIComponent(input);
  }

  visitObject(): [URIChargeConsumer, () => URIChargeObject] {
    const consumer = new DefaultURIChargeConsumer();
    const { object } = consumer;

    return [consumer, () => object];
  }

}
