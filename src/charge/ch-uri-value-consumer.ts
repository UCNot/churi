import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';

export interface ChURIValueConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  set(value: ChURIValue<TValue>, type: string): TCharge;

  startMap(): ChURIMapConsumer<TValue, TCharge>;

  startList(): ChURIListConsumer<TValue, TCharge>;
}

export interface ChURIMapConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  put(key: string, value: ChURIValue<TValue>, type: string): void;

  startMap(key: string): ChURIMapConsumer<TValue>;

  startList(key: string): ChURIListConsumer<TValue>;

  addSuffix(suffix: string): void;

  endMap(): TCharge;
}

export interface ChURIListConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  add(value: ChURIValue<TValue>, type: string): void;

  startMap(): ChURIMapConsumer<TValue>;

  startList(): ChURIListConsumer<TValue>;

  endList(): TCharge;
}

export interface ChURIDirectiveConsumer<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  add(value: ChURIValue<TValue>, type: string): void;

  startMap(): ChURIMapConsumer<TValue>;

  startList(): ChURIListConsumer<TValue>;

  endDirective(): TCharge;
}
