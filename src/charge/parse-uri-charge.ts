import { StandardUcExt } from '../ext/standard.uc-ext.js';
import { UcPrimitive } from '../schema/uc-primitive.js';
import { URIChargeBuilder } from './uri-charge-builder.js';
import { URIChargeParser } from './uri-charge-parser.js';
import { URICharge } from './uri-charge.js';

const URIChargeBuilder$instance = /*#__PURE__*/ new URIChargeBuilder<any>();

let URIChargeParser$default: URIChargeParser<any, any> | undefined;

/**
 * Creates {@link URIChargeParser parser} that represents parsed URI charge in {@link URICharge generic} way.
 *
 * Builds charge with {@link URIChargeBuilder} by default.
 *
 * @param options - Parser options.
 *
 * @returns Parser instance.
 */
export function createURIChargeParser<TValue>(
  options?: Partial<URIChargeParser.Options<TValue, URICharge<TValue>>>,
): URIChargeParser<TValue, URICharge<TValue>> {
  const { rx = URIChargeBuilder$instance as URIChargeBuilder<TValue>, ext = StandardUcExt } =
    options ?? {};

  if (!options) {
    return (URIChargeParser$default ??= new URIChargeParser({
      rx,
      ext,
    })) as URIChargeParser<TValue, URICharge<TValue>>;
  }

  return new URIChargeParser({ rx, ext }) as URIChargeParser<TValue, URICharge<TValue>>;
}

/**
 * Parses input containing URI charge and represents it in {@link URICharge generic} way.
 *
 * Builds charge with {@link URIChargeBuilder} by default.
 *
 * @param options - Parser options.
 *
 * @returns Parse result containing charge representation.
 */
export function parseURICharge<TValue = UcPrimitive>(
  input: string,
  options?: Partial<URIChargeParser.Options<TValue, URICharge<TValue>>>,
): URIChargeParser.Result<URICharge<TValue>> {
  return createURIChargeParser<TValue>(
    options as URIChargeParser.Options<TValue, URICharge<TValue>>,
  ).parse(input);
}
