import { ChURIValueBuilder } from './ch-uri-value-builder.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { PredefinedChURIExt } from './ext/predefined.ch-uri-ext.js';
import { URIChargeParser } from './uri-charge-parser.js';

const ChURIValueBuilder$instance = /*#__PURE__*/ new ChURIValueBuilder<any>();

let URIChargeParser$default: URIChargeParser<any, any> | undefined;

export function createChURIValueParser<TValue>(
  options?: Partial<URIChargeParser.Options<TValue, ChURIValue<TValue>>>,
): URIChargeParser<TValue, ChURIValue<TValue>> {
  const { rx = ChURIValueBuilder$instance as ChURIValueBuilder<TValue>, ext = PredefinedChURIExt } =
    options ?? {};

  if (!options) {
    return (URIChargeParser$default ??= new URIChargeParser({
      rx,
      ext,
    })) as URIChargeParser<TValue, ChURIValue<TValue>>;
  }

  return new URIChargeParser({ rx, ext }) as URIChargeParser<TValue, ChURIValue<TValue>>;
}

export function parseChURIValue<TValue = ChURIPrimitive>(
  input: string,
  options?: Partial<URIChargeParser.Options<TValue, ChURIValue<TValue>>>,
): URIChargeParser.Result<ChURIValue<TValue>> {
  return createChURIValueParser<TValue>(
    options as URIChargeParser.Options<TValue, ChURIValue<TValue>>,
  ).parse(input);
}
