import { ChURIPrimitive } from './ch-uri-value.js';

export abstract class ChURIObjectConsumer {

  addBigInt(key: string, value: bigint, append: boolean): void {
    this.addPrimitive(key, value, append);
  }

  addBoolean(key: string, value: boolean, append: boolean): void {
    this.addPrimitive(key, value, append);
  }

  addNumber(key: string, value: number, append: boolean): void {
    this.addPrimitive(key, value, append);
  }

  addString(key: string, value: string, append: boolean): void {
    this.addPrimitive(key, value, append);
  }

  addSuffix(suffix: string): void {
    this.addBoolean(suffix, true, false);
  }

  abstract addPrimitive(key: string, value: ChURIPrimitive, append: boolean): void;

  abstract startObject(key: string, append: boolean): ChURIObjectConsumer;

  endObject(): void {
    // Do nothing.
  }

}
