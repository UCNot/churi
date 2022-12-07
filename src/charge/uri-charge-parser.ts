import { ChURIPrimitive } from './ch-uri-value.js';
import { defaultChURIValueDecoder } from './impl/ch-uri-value-decoder.js';
import { parseChURIValue } from './impl/parse-ch-uri-value.js';
import { URIChargeExtParser } from './impl/uri-charge-ext-parser.js';
import { URIChargeTarget } from './impl/uri-charge-target.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class URIChargeParser<out TValue = ChURIPrimitive, out TCharge = unknown> {

  readonly #rx: URIChargeRx<TValue, TCharge>;
  readonly #extParser: URIChargeExtParser<TValue, TCharge>;

  constructor(options: URIChargeParser.Options<TValue, TCharge>) {
    const { rx, ext } = options;

    this.#rx = rx;
    this.#extParser = new URIChargeExtParser(rx, ext);
  }

  get chargeRx(): URIChargeRx<TValue, TCharge> {
    return this.#rx;
  }

  parse(
    input: string,
    rx: URIChargeRx.ValueRx<TValue, TCharge> = this.chargeRx.rxValue(),
  ): URIChargeParser.Result<TCharge> {
    const decoder = defaultChURIValueDecoder;

    const to: URIChargeTarget<TValue, TCharge> = {
      rx,
      decoder,
      ext: this.#extParser,
      decode: input => decoder.decodeValue(to, input),
    };

    return parseChURIValue(to, input);
  }

}

export namespace URIChargeParser {
  export interface Options<out TValue, out TCharge> {
    readonly rx: URIChargeRx<TValue, TCharge>;
    readonly ext?: URIChargeExt.Spec<TValue, TCharge> | undefined;
  }
  export interface Result<out TCharge> {
    readonly charge: TCharge;
    readonly end: number;
  }
}
