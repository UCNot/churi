import { URIChargeParser } from './uri-charge-parser.js';

export function parseURICharge<T>(
  input: string,
  options: URIChargeParser.Options<T>,
): URIChargeParser.Result<T>;

export function parseURICharge(
  input: string,
  options?: URIChargeParser.Options.WithoutVisitor,
): URIChargeParser.Result;

export function parseURICharge<T>(
  input: string,
  options?: URIChargeParser.Options<T>,
): URIChargeParser.Result<T> {
  return URIChargeParser.get(options as URIChargeParser.Options.WithVisitor<T>).parse(input);
}
