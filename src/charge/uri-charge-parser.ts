import { ChURIExt } from './ch-uri-ext.js';
import { ChURIValueBuilder } from './ch-uri-value-builder.js';
import { ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { PredefinedChURIExt } from './ext/predefined.ch-uri-ext.js';
import { ChURIExtParser } from './impl/ch-uri-ext-parser.js';
import { defaultChURIValueDecoder } from './impl/ch-uri-value-decoder.js';
import { parseChURIValue } from './impl/parse-ch-uri-value.js';
import { URIChargeTarget } from './impl/uri-charge-target.js';

export class URIChargeParser<in TValue = ChURIPrimitive, out TCharge = ChURIValue<TValue>> {

  readonly #to: URIChargeTarget<TValue, TCharge>;

  constructor(
    ...options: ChURIValue extends TCharge
      ? ChURIPrimitive extends TValue
        ? [URIChargeParser.Options<TValue, TCharge>?]
        : [URIChargeParser.Options.DefaultConsumer<TValue, TCharge>]
      : ChURIPrimitive extends TValue
      ? [URIChargeParser.Options.DefaultExt<TValue, TCharge>]
      : [URIChargeParser.Options.Custom<TValue, TCharge>]
  );

  constructor(options?: URIChargeParser.Options<TValue, TCharge>) {
    const decoder = defaultChURIValueDecoder;

    this.#to = {
      consumer: options?.consumer ?? ChURIValueBuilder$instance,
      decoder,
      ext: new ChURIExtParser(options?.ext),
      decode: input => decoder.decodeValue(this.#to, input),
    };
  }

  parse(input: string): URIChargeParser.Result<TCharge> {
    return parseChURIValue(this.#to, input);
  }

}

export namespace URIChargeParser {
  export type Options<TValue, TCharge> =
    | Options.Custom<TValue, TCharge>
    | Options.DefaultConsumer<TValue, TCharge>
    | Options.DefaultExt<TValue, TCharge>
    | Options.Default;
  export namespace Options {
    export interface Base<in TValue, out TCharge> {
      readonly consumer?: ChURIValueConsumer<TValue, TCharge> | undefined;
      readonly ext?: ChURIExt<TValue> | readonly ChURIExt<TValue>[] | undefined;
    }
    export interface Custom<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer: ChURIValueConsumer<TValue, TCharge>;
      readonly ext: ChURIExt<TValue> | readonly ChURIExt<TValue>[];
    }
    export interface DefaultExt<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer: ChURIValueConsumer<TValue, TCharge>;
      readonly ext?: ChURIExt<TValue> | readonly ChURIExt<TValue>[] | undefined;
    }
    export interface DefaultConsumer<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer?: ChURIValueConsumer<TValue, TCharge> | undefined;
      readonly ext: ChURIExt<TValue> | readonly ChURIExt<TValue>[];
    }
    export interface Default extends Base<ChURIPrimitive, ChURIValue> {
      readonly consumer?: undefined;
      readonly ext?: undefined;
    }
  }
  export interface Result<out TCharge = ChURIValue> {
    readonly charge: TCharge;
    readonly end: number;
  }
}

const ChURIValueBuilder$instance = /*#__PURE__*/ new ChURIValueBuilder<any>();

let URIChargeParser$default: URIChargeParser | undefined;

export function createURIChargeParser<TValue, TCharge>(
  options: URIChargeParser.Options<TValue, TCharge>,
): URIChargeParser<ChURIPrimitive, TCharge>;

export function createURIChargeParser(options?: URIChargeParser.Options.Default): URIChargeParser;

export function createURIChargeParser<TValue, TCharge>(
  options?: URIChargeParser.Options<TValue, TCharge>,
): URIChargeParser<TValue, TCharge> {
  if (options) {
    return new URIChargeParser(options as URIChargeParser.Options<any, any>);
  }

  return (URIChargeParser$default ??= new URIChargeParser({
    ext: PredefinedChURIExt,
  })) as URIChargeParser<any, TCharge>;
}
