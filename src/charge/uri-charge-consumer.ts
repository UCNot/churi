import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';

export interface URIChargeConsumer<out T> {
  setString(value: string): T;
  startObject(): ChURIObjectConsumer<T>;
  startArray(): ChURIArrayConsumer<T>;
}
