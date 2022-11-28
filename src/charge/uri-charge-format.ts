import { ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive } from './ch-uri-value.js';

export interface URIChargeFormat<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  readonly entities?:
    | {
        readonly [rawKey: string]: URIChargeFormat.Entity<TValue, TCharge>;
      }
    | undefined;
}

export namespace URIChargeFormat {
  export type Entity<in out TValue = ChURIPrimitive, out TCharge = unknown> = <
    TResult extends TCharge,
  >(
    consumer: ChURIValueConsumer<TValue, TResult>,
    rawKey: string,
  ) => TCharge;
}
