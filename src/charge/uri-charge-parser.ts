import { decodeUcValue } from './impl/uc-value-decoder.js';
import { parseUcArgs, parseUcValue } from './impl/uc-value-parser.js';
import { URIChargeExtParser } from './impl/uri-charge-ext-parser.js';
import { UcPrimitive } from './uc-value.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeRx } from './uri-charge-rx.js';

export class URIChargeParser<out TValue = UcPrimitive, out TCharge = unknown> {

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
    return parseUcValue(this.#ext.valueTarget, rx, '', decodeUcValue, input);
  }

  parseArgs(
    input: string,
    rx?: URIChargeRx.DirectiveRx<TValue, TCharge>,
  ): URIChargeParser.Result<TCharge> {
    if (rx) {
      const end = this.#parseArgs(input, rx);

      return { charge: rx.endDirective(), end };
    }

    let end!: number;
    const charge = this.chargeRx.rxArgs(rx => {
      end = this.#parseArgs(input, rx);

      return rx.endDirective();
    });

    return { charge, end };
  }

  #parseArgs(input: string, rx: URIChargeRx.DirectiveRx<TValue, TCharge>): number {
    let offset = 0;

    if (input.startsWith('(')) {
      offset = 1;
      input = input.slice(1);
    }

    return offset + parseUcArgs(this.#ext.itemTarget, rx, input);
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
