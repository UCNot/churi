import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIPrimitive } from './ch-uri-value.js';

export abstract class ChURIObjectConsumer<out T = unknown> {

  addBigInt(key: string, value: bigint): void {
    this.addPrimitive(key, value);
  }

  addBoolean(key: string, value: boolean): void {
    this.addPrimitive(key, value);
  }

  addNumber(key: string, value: number): void {
    this.addPrimitive(key, value);
  }

  addString(key: string, value: string): void {
    this.addPrimitive(key, value);
  }

  addSuffix(suffix: string): void {
    this.addBoolean(suffix, true);
  }

  abstract addPrimitive(key: string, value: ChURIPrimitive): void;

  abstract startObject(key: string): ChURIObjectConsumer;

  abstract startArray(key: string): ChURIArrayConsumer;

  abstract endObject(): T;

}
