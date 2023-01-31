import { UcPrimitive } from '../schema/uc-primitive.js';
import { UcValue } from '../schema/uc-value.js';
import { unchargeEntities } from '../uncharge/uncharge-entities.js';
import { UcValueBuilder } from './uc-value-builder.js';
import { URIChargeParser } from './uri-charge-parser.js';

const UcValueBuilder$instance = /*#__PURE__*/ new UcValueBuilder<any>();

let UcValueParser$default: URIChargeParser<any, any> | undefined;

/**
 * Creates {@link URIChargeParser parser} that represents parsed URI charge as {@link UcValue native} JavaScript value.
 *
 * Builds charge with {@link UcValueBuilder} by default.
 *
 * @param options - Parser options.
 *
 * @returns Parser instance.
 */
export function createUcValueParser<TValue>(
  options?: Partial<URIChargeParser.Options<TValue, UcValue<TValue>>>,
): URIChargeParser<TValue, UcValue<TValue>> {
  const {
    rx = UcValueBuilder$instance as UcValueBuilder<TValue>,
    recognize: ext = unchargeEntities,
  } = options ?? {};

  if (!options) {
    return (UcValueParser$default ??= new URIChargeParser({
      rx,
      recognize: ext,
    })) as URIChargeParser<TValue, UcValue<TValue>>;
  }

  return new URIChargeParser({ rx, recognize: ext }) as URIChargeParser<TValue, UcValue<TValue>>;
}

/**
 * Parses input containing URI charge and represents it as {@link UcValue native} JavaScript value.
 *
 * Builds charge with {@link UcValueBuilder} by default.
 *
 * @param options - Parser options.
 *
 * @returns Parse result containing charge representation.
 */
export function parseUcValue<TValue = UcPrimitive>(
  input: string,
  options?: Partial<URIChargeParser.Options<TValue, UcValue<TValue>>>,
): URIChargeParser.Result<UcValue<TValue>> {
  return createUcValueParser<TValue>(
    options as URIChargeParser.Options<TValue, UcValue<TValue>>,
  ).parse(input);
}
