import { URIChargeExt } from '../charge/uri-charge-ext.js';

/**
 * URI charge extension that add support for:
 *
 * - `!Infinity` entity for `Infinity` value,
 * - `!-Infinity` entity for negative `Infinity` value,
 * - `!NaN` entity for `NaN` value.
 */
export function NumberValuesUcExt<TValue, TCharge>(
  target: URIChargeExt.Target<TValue, TCharge>,
): URIChargeExt<TValue, TCharge>;

export function NumberValuesUcExt<TValue, TCharge>({
  chargeRx,
}: URIChargeExt.Target<TValue, TCharge>): URIChargeExt<TValue, TCharge> {
  return {
    entities: {
      ['!Infinity'](): TCharge {
        return chargeRx.createValue(Infinity, 'number');
      },

      ['!-Infinity'](): TCharge {
        return chargeRx.createValue(-Infinity, 'number');
      },

      ['!NaN'](): TCharge {
        return chargeRx.createValue(NaN, 'number');
      },
    },
  };
}
