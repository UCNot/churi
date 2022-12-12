import { ChURIPrimitive } from './ch-uri-value.js';
import { decodeChURIValue } from './impl/ch-uri-value-decoder.js';
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

  parse(input: string, rx?: URIChargeRx.ValueRx<TValue, TCharge>): URIChargeParser.Result<TCharge> {
    if (rx) {
      return this.#parse(input, rx);
    }

    let result!: URIChargeParser.Result<TCharge>;

    this.chargeRx.rxValue(rx => {
      result = this.#parse(input, rx);

      return result.charge;
    });

    return result;
  }

  #parse(input: string, rx: URIChargeRx.ValueRx<TValue, TCharge>): URIChargeParser.Result<TCharge> {
    const to: URIChargeTarget<TValue, TCharge> = {
      rx,
      decoder: decodeChURIValue,
      ext: this.#extParser,
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
