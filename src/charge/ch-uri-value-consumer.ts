import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';

export abstract class ChURIValueConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {

  abstract set(value: ChURIValue<TValue>, type: string): TCharge;

  setEntity(entity: string): TCharge {
    return this.set(decodeURIComponent(entity), 'unrecognized-entity');
  }

  abstract startObject(): ChURIObjectConsumer<TValue, TCharge>;

  abstract startArray(): ChURIArrayConsumer<TValue, TCharge>;

}
