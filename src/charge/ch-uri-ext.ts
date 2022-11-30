import { ChURIDirectiveConsumer, ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive } from './ch-uri-value.js';

export interface ChURIExt<in TValue = ChURIPrimitive> {
  readonly entities?:
    | {
        readonly [rawEntity: string]: ChURIEntityHandler<TValue>;
      }
    | undefined;
  readonly directives?:
    | {
        readonly [rawName: string]: ChURIDirectiveHandler<TValue>;
      }
    | undefined;
}

export type ChURIEntityHandler<in TValue = ChURIPrimitive> = <TCharge>(
  context: ChURIExtHandlerContext<TValue, TCharge>,
  rawEntity: string,
) => TCharge;

export type ChURIDirectiveHandler<in TValue = ChURIPrimitive> = <TCharge>(
  context: ChURIExtHandlerContext<TValue, TCharge>,
  rawName: string,
) => ChURIDirectiveConsumer<TValue, TCharge>;

export interface ChURIExtHandlerContext<in TValue = ChURIPrimitive, out TCharge = unknown> {
  readonly consumer: ChURIValueConsumer<TValue, TCharge>;
}
