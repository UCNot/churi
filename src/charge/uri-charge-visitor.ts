import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';

export interface URIChargeVisitor<out T> {
  visitString(value: string): T;
  visitObject(): [consumer: ChURIObjectConsumer, endCharge: () => T];
}
