import { ChURIValueBuilder } from './ch-uri-value-builder.js';
import { ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { PredefinedURIChargeFormats } from './formats/predefined.uri-charge-formats.js';
import { parseURIChargeValue } from './impl/parse-uri-charge-value.js';
import { defaultURIChargeDecoder } from './impl/uri-charge-decoder.js';
import { URIChargeFormatParser } from './impl/uri-charge-format-parser.js';
import { URIChargeTarget } from './impl/uri-charge-target.js';
import { URIChargeFormat } from './uri-charge-format.js';

export class URIChargeParser<in out TValue = ChURIPrimitive, out TCharge = ChURIValue<TValue>> {

  readonly #to: URIChargeTarget<TValue, TCharge>;

  constructor(
    ...options: ChURIValue extends TCharge
      ? ChURIPrimitive extends TValue
        ? [URIChargeParser.Options<TValue, TCharge>?]
        : [URIChargeParser.Options.DefaultFormat<TValue, TCharge>]
      : ChURIPrimitive extends TValue
      ? [URIChargeParser.Options.DefaultConsumer<TValue, TCharge>]
      : [URIChargeParser.Options.Custom<TValue, TCharge>]
  );

  constructor(options?: URIChargeParser.Options<TValue, TCharge>) {
    const decoder = defaultURIChargeDecoder;

    this.#to = {
      consumer: options?.consumer ?? ChURIValueBuilder$instance,
      decoder,
      formatParser: new URIChargeFormatParser(options?.format),
      decode: input => decoder.decodeValue(this.#to, input),
    };
  }

  parse(input: string): URIChargeParser.Result<TCharge> {
    return parseURIChargeValue(this.#to, input);
  }

}

export namespace URIChargeParser {
  export type Options<TValue, TCharge> =
    | Options.Custom<TValue, TCharge>
    | Options.DefaultConsumer<TValue, TCharge>
    | Options.DefaultFormat<TValue, TCharge>
    | Options.Default;
  export namespace Options {
    export interface Base<in out TValue, out TCharge> {
      readonly consumer?: ChURIValueConsumer<TValue, TCharge> | undefined;
      readonly format?: URIChargeFormat<TValue> | readonly URIChargeFormat<TValue>[] | undefined;
    }
    export interface Custom<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer: ChURIValueConsumer<TValue, TCharge>;
      readonly format: URIChargeFormat<TValue> | readonly URIChargeFormat<TValue>[];
    }
    export interface DefaultFormat<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer: ChURIValueConsumer<TValue, TCharge>;
      readonly format?: URIChargeFormat<TValue> | readonly URIChargeFormat<TValue>[] | undefined;
    }
    export interface DefaultConsumer<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer?: ChURIValueConsumer<TValue, TCharge> | undefined;
      readonly format: URIChargeFormat<TValue> | readonly URIChargeFormat<TValue>[];
    }
    export interface Default extends Base<ChURIPrimitive, ChURIValue> {
      readonly consumer?: undefined;
      readonly format?: undefined;
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
    format: PredefinedURIChargeFormats,
  })) as URIChargeParser<any, TCharge>;
}
