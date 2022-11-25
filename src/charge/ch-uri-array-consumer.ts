import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIValue } from './ch-uri-value.js';

export abstract class ChURIArrayConsumer<out T = unknown> {

  addBigInt(value: bigint): void {
    this.addValue(value);
  }

  addBoolean(value: boolean): void {
    this.addValue(value);
  }

  addNumber(value: number): void {
    this.addValue(value);
  }

  addString(value: string): void {
    this.addValue(value);
  }

  abstract startObject(): ChURIObjectConsumer;

  abstract startArray(): ChURIArrayConsumer;

  abstract addValue(value: ChURIValue): void;

  abstract endArray(): T;

}
