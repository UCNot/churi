import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';

export abstract class ChURIArrayConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {

  abstract add(value: ChURIValue<TValue>, type: string): void;

  abstract startObject(): ChURIObjectConsumer<TValue>;

  abstract startArray(): ChURIArrayConsumer<TValue>;

  abstract endArray(): TCharge;

}
