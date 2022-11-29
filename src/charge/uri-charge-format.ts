import { ChURIArrayConsumer, ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive } from './ch-uri-value.js';

export interface URIChargeFormat<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  readonly entities?:
    | {
        readonly [rawEntity: string]: URIChargeEntity<TValue, TCharge>;
      }
    | undefined;
  readonly directives?:
    | {
        readonly [rawName: string]: URIChargeDirective<TValue, TCharge>;
      }
    | undefined;
}

export type URIChargeEntity<in out TValue = ChURIPrimitive, out TCharge = unknown> = <
  TResult extends TCharge,
>(
  context: URIChargeContext<TValue, TResult>,
  rawEntity: string,
) => TCharge;

export type URIChargeDirective<in out TValue = ChURIPrimitive, out TCharge = unknown> = <
  TResult extends TCharge,
>(
  context: URIChargeContext<TValue, TResult>,
  rawName: string,
) => ChURIArrayConsumer<TValue, TResult>;

export interface URIChargeContext<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  readonly consumer: ChURIValueConsumer<TValue, TCharge>;
}
