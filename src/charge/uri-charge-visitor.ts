import { URIChargeConsumer } from './uri-charge-consumer.js';

export interface URIChargeVisitor<out T> {
  visitString(value: string): T;
  visitObject(): [consumer: URIChargeConsumer, endCharge: () => T];
}
