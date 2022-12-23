import { URIChargeExt } from '../charge/uri-charge-ext.js';
import { URIChargeRx } from '../charge/uri-charge-rx.js';

export function NumberValuesUcExt<TValue, TCharge>(
  charge: URIChargeRx<TValue, TCharge>,
): URIChargeExt<TValue, TCharge> {
  return {
    entities: {
      ['!Infinity'](): TCharge {
        return charge.createValue(Infinity, 'number');
      },

      ['!-Infinity'](): TCharge {
        return charge.createValue(-Infinity, 'number');
      },

      ['!NaN'](): TCharge {
        return charge.createValue(NaN, 'number');
      },
    },
  };
}
