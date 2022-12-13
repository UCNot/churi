import { ChURIPrimitive } from './churi-value.js';
import { decodeChURIValue } from './impl/churi-value-decoder.js';
import { parseChURIValue } from './impl/parse-churi-value.js';
import { URIChargeExtParser } from './impl/uri-charge-ext-parser.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class URIChargeParser<out TValue = ChURIPrimitive, out TCharge = unknown> {

  readonly #rx: URIChargeRx<TValue, TCharge>;
  readonly #ext: URIChargeExtParser<TValue, TCharge>;

  constructor(options: URIChargeParser.Options<TValue, TCharge>) {
    const { rx, ext } = options;

    this.#rx = rx;
    this.#ext = new URIChargeExtParser(rx, ext);
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
    return parseChURIValue(this.#ext.valueTarget, rx, '', decodeChURIValue, input);
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
