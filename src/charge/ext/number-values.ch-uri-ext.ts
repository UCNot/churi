import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export function NumberValuesChURIExt<TValue, TCharge>(
  _charge: URIChargeRx<TValue, TCharge>,
): URIChargeExt<TValue, TCharge> {
  return {
    entities: {
      ['!Infinity']({ rx }: URIChargeExt.Context<TValue, TCharge>): TCharge {
        return rx.set(Infinity, 'number');
      },

      ['!-Infinity']({ rx }: URIChargeExt.Context<TValue, TCharge>): TCharge {
        return rx.set(-Infinity, 'number');
      },

      ['!NaN']<TCharge>({ rx }: URIChargeExt.Context<TValue, TCharge>): TCharge {
        return rx.set(NaN, 'number');
      },
    },
  };
}
