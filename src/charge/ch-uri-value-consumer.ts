import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIValue } from './ch-uri-value.js';

export abstract class ChURIValueConsumer<in out TValue = never, out TCharge = unknown> {

  abstract set(value: ChURIValue<TValue>, type: string): TCharge;

  abstract startObject(): ChURIObjectConsumer<TValue, TCharge>;

  abstract startArray(): ChURIArrayConsumer<TValue, TCharge>;

}
