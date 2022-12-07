import { ChURIPrimitive } from './ch-uri-value.js';
import { defaultChURIValueDecoder } from './impl/ch-uri-value-decoder.js';
import { parseChURIValue } from './impl/parse-ch-uri-value.js';
import { URIChargeExtParser } from './impl/uri-charge-ext-parser.js';
import { URIChargeTarget } from './impl/uri-charge-target.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class URIChargeParser<out TValue = ChURIPrimitive, out TCharge = unknown> {

  readonly #to: URIChargeTarget<TValue, TCharge>;

  constructor(options: URIChargeParser.Options<TValue, TCharge>) {
    const { rx } = options;
    const decoder = defaultChURIValueDecoder;

    this.#to = {
      rx: rx.rxValue(),
      decoder,
      ext: new URIChargeExtParser(rx, options?.ext),
      decode: input => decoder.decodeValue(this.#to, input),
    };
  }

  parse(input: string): URIChargeParser.Result<TCharge> {
    return parseChURIValue(this.#to, input);
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
