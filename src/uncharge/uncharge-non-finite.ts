import { URIUncharger } from '../charge/uri-uncharger.js';

/**
 * Uncharges non-finite numbers.
 *
 * Enables support for:
 *
 * - `!Infinity` entity for `Infinity` value,
 * - `!-Infinity` entity for negative `Infinity` value,
 * - `!NaN` entity for `NaN` value.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 */
export function unchargeNonFinite<TValue, TCharge>(
  target: URIUncharger.Target<TValue, TCharge>,
): URIUncharger<TValue, TCharge>;

export function unchargeNonFinite<TValue, TCharge>({
  chargeRx,
}: URIUncharger.Target<TValue, TCharge>): URIUncharger<TValue, TCharge> {
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
