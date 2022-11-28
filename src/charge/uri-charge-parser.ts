import { ChURIValueBuilder } from './ch-uri-value-builder.js';
import { ChURIValueConsumer } from './ch-uri-value-consumer.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { parseURIChargeValue } from './impl/parse-uri-charge-value.js';

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
      ? new URIChargeParser(options as URIChargeParser.Options.WithConsumer<TValue, TCharge>)
      : (URIChargeParser.default as URIChargeParser<any, TCharge>);
  }

  readonly #consumer: ChURIValueConsumer<TValue, TCharge>;

  constructor(
    ...options: ChURIValue extends TCharge
      ? [URIChargeParser.Options<TValue, TCharge>?]
      : [URIChargeParser.Options.WithConsumer<TValue, TCharge>]
  );

  constructor(options?: URIChargeParser.Options<TValue, TCharge>) {
    this.#consumer = options?.consumer ?? ChURIValueBuilder$instance;
  }

  parse(input: string): URIChargeParser.Result<TCharge> {
    if (!input) {
      // Top-level empty string is treated as is, rather as empty object.
      return { charge: this.#consumer.set(input, 'string'), end: 0 };
    }

    return parseURIChargeValue(this.#consumer, input);
  }

}

export namespace URIChargeParser {
  export type Options<TValue, TCharge> = Options.WithConsumer<TValue, TCharge> | Options.Default;
  export namespace Options {
    export interface Base<in out TValue, out TCharge> {
      readonly consumer?: ChURIValueConsumer<TValue, TCharge> | undefined;
    }
    export interface WithConsumer<in out TValue, TCharge> extends Base<TValue, TCharge> {
      readonly consumer: ChURIValueConsumer<TValue, TCharge>;
    }
    export interface Default extends Base<ChURIPrimitive, ChURIValue> {
      readonly consumer?: undefined;
    }
  }
  export interface Result<out TCharge = ChURIValue> {
    readonly charge: TCharge;
    readonly end: number;
  }
}

const ChURIValueBuilder$instance = /*#__PURE__*/ new ChURIValueBuilder<any>();
