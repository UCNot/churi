import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIValue } from './ch-uri-value.js';

export abstract class ChURIObjectConsumer<in out TValue = never, out TCharge = unknown> {

  abstract put(key: string, value: ChURIValue<TValue>, type: string): void;

  abstract startObject(key: string): ChURIObjectConsumer<TValue>;

  abstract startArray(key: string): ChURIArrayConsumer<TValue>;

  addSuffix(suffix: string): void {
    this.startObject(suffix).endObject();
  }

  abstract endObject(): TCharge;

}
