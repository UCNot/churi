import { URIChargeParser } from './uri-charge-parser.js';

export function parseURICharge<T>(
  input: string,
  options: URIChargeParser.Options<T>,
): URIChargeParser.Result<T>;

export function parseURICharge(
  input: string,
  options?: URIChargeParser.Options.WithoutConsumer,
): URIChargeParser.Result;

export function parseURICharge<T>(
  input: string,
  options?: URIChargeParser.Options<T>,
): URIChargeParser.Result<T> {
  return URIChargeParser.get(options as URIChargeParser.Options.WithConsumer<T>).parse(input);
}
