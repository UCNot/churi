import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';

export interface URIChargeVisitor<out T> {
  visitString(value: string): T;
  visitObject(): ChURIObjectConsumer<T>;
  visitArray(): ChURIArrayConsumer<T>;
}
