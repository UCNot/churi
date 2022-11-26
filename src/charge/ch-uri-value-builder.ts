import { ChURIArrayBuilder } from './ch-uri-array-builder.js';
import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectBuilder } from './ch-uri-object-builder.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIValue } from './ch-uri-value.js';

export class ChURIValueBuilder<in out TValue = unknown> extends ChURIValueConsumer<
  TValue,
  ChURIValue<TValue>
> {

  override set(value: ChURIValue<TValue>, _type: string): ChURIValue<TValue> {
    return value;
  }

  override startObject(): ChURIObjectConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIObjectBuilder<TValue>();
  }

  override startArray(): ChURIArrayConsumer<TValue, ChURIValue<TValue>> {
    return new ChURIArrayBuilder<TValue>();
  }

}
