import { StandardUcExt } from './ext/standard.uc-ext.js';
import { UcValueBuilder } from './uc-value-builder.js';
import { UcPrimitive, UcValue } from './uc-value.js';
import { URIChargeParser } from './uri-charge-parser.js';

const UcValueBuilder$instance = /*#__PURE__*/ new UcValueBuilder<any>();

let UcValueParser$default: URIChargeParser<any, any> | undefined;

export function createUcValueParser<TValue>(
  options?: Partial<URIChargeParser.Options<TValue, UcValue<TValue>>>,
): URIChargeParser<TValue, UcValue<TValue>> {
  const { rx = UcValueBuilder$instance as UcValueBuilder<TValue>, ext = StandardUcExt } =
    options ?? {};

  if (!options) {
    return (UcValueParser$default ??= new URIChargeParser({
      rx,
      ext,
    })) as URIChargeParser<TValue, UcValue<TValue>>;
  }

  return new URIChargeParser({ rx, ext }) as URIChargeParser<TValue, UcValue<TValue>>;
}

export function parseUcValue<TValue = UcPrimitive>(
  input: string,
  options?: Partial<URIChargeParser.Options<TValue, UcValue<TValue>>>,
): URIChargeParser.Result<UcValue<TValue>> {
  return createUcValueParser<TValue>(
    options as URIChargeParser.Options<TValue, UcValue<TValue>>,
  ).parse(input);
}
