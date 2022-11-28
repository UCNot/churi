import { ChURIValueBuilder } from './ch-uri-value-builder.js';
import { ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { parseURIChargeValue } from './impl/parse-uri-charge-value.js';
import { URIChargeFormatParser } from './impl/uri-charge-format-parser.js';
import { URIChargeTarget } from './impl/uri-charge-target.js';
import { URIChargeFormat } from './uri-charge-format.js';

let URIChargeParser$default: URIChargeParser | undefined;

export class URIChargeParser<in out TValue = ChURIPrimitive, out TCharge = ChURIValue> {

  static get default(): URIChargeParser {
    return (URIChargeParser$default ??= new URIChargeParser());
  }

  static get<TValue, TCharge>(
    options: URIChargeParser.Options<TValue, TCharge>,
  ): URIChargeParser<ChURIPrimitive, TCharge>;

  static get(options?: URIChargeParser.Options.Default): URIChargeParser;

  static get<TValue, TCharge>(
    options?: URIChargeParser.Options<TValue, TCharge>,
  ): URIChargeParser<TValue, TCharge> {
    return options
      ? new URIChargeParser(options as URIChargeParser.Options<any, any>)
      : (URIChargeParser.default as URIChargeParser<any, TCharge>);
  }

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
    this.#to = {
      consumer: options?.consumer ?? ChURIValueBuilder$instance,
      formatParser: new URIChargeFormatParser(options?.format),
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
      readonly format?:
        | URIChargeFormat<TValue, TCharge>
        | readonly URIChargeFormat<TValue, TCharge>[]
        | undefined;
    }
    export interface Custom<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer: ChURIValueConsumer<TValue, TCharge>;
      readonly format:
        | URIChargeFormat<TValue, TCharge>
        | readonly URIChargeFormat<TValue, TCharge>[];
    }
    export interface DefaultFormat<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer: ChURIValueConsumer<TValue, TCharge>;
      readonly format?:
        | URIChargeFormat<TValue, TCharge>
        | readonly URIChargeFormat<TValue, TCharge>[]
        | undefined;
    }
    export interface DefaultConsumer<in out TValue, out TCharge> extends Base<TValue, TCharge> {
      readonly consumer?: ChURIValueConsumer<TValue, TCharge> | undefined;
      readonly format:
        | URIChargeFormat<TValue, TCharge>
        | readonly URIChargeFormat<TValue, TCharge>[];
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
