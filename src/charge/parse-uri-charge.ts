import { URIChargeParser } from './uri-charge-parser.js';

export function parseURICharge<TValue, TCharge>(
  input: string,
  options: URIChargeParser.Options<TValue, TCharge>,
): URIChargeParser.Result<TCharge>;

export function parseURICharge(
  input: string,
  options?: URIChargeParser.Options.Default,
): URIChargeParser.Result;

export function parseURICharge<TValue, TCharge>(
  input: string,
  options?: URIChargeParser.Options<TValue, TCharge>,
): URIChargeParser.Result<TCharge> {
  return URIChargeParser.get(options as URIChargeParser.Options.WithConsumer<any, TCharge>).parse(
    input,
  );
}
