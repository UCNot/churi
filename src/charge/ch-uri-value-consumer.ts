import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';

export abstract class ChURIValueConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {

  abstract set(value: ChURIValue<TValue>, type: string): TCharge;

  abstract startObject(): ChURIObjectConsumer<TValue, TCharge>;

  abstract startArray(): ChURIArrayConsumer<TValue, TCharge>;

}

export abstract class ChURIObjectConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {

  abstract put(key: string, value: ChURIValue<TValue>, type: string): void;

  abstract startObject(key: string): ChURIObjectConsumer<TValue>;

  abstract startArray(key: string): ChURIArrayConsumer<TValue>;

  addSuffix(suffix: string): void {
    this.startObject(suffix).endObject();
  }

  abstract endObject(): TCharge;

}

export abstract class ChURIArrayConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {

  abstract add(value: ChURIValue<TValue>, type: string): void;

  abstract startObject(): ChURIObjectConsumer<TValue>;

  abstract startArray(): ChURIArrayConsumer<TValue>;

  abstract endArray(): TCharge;

}
