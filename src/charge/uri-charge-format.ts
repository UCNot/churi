import { ChURIArrayConsumer, ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive } from './ch-uri-value.js';

export interface URIChargeFormat<in out TValue = ChURIPrimitive> {
  readonly entities?:
    | {
        readonly [rawEntity: string]: URIChargeEntity<TValue>;
      }
    | undefined;
  readonly directives?:
    | {
        readonly [rawName: string]: URIChargeDirective<TValue>;
      }
    | undefined;
}

export type URIChargeEntity<in out TValue = ChURIPrimitive> = <TCharge>(
  context: URIChargeContext<TValue, TCharge>,
  rawEntity: string,
) => TCharge;

export type URIChargeDirective<in out TValue = ChURIPrimitive> = <TCharge>(
  context: URIChargeContext<TValue, TCharge>,
  rawName: string,
) => ChURIArrayConsumer<TValue, TCharge>;

export interface URIChargeContext<in out TValue = ChURIPrimitive, out TCharge = unknown> {
  readonly consumer: ChURIValueConsumer<TValue, TCharge>;
}
