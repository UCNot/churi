import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export function NumberValuesChURIExt<TValue, TCharge>(
  _charge: URIChargeRx<TValue, TCharge>,
): URIChargeExt<TValue, TCharge> {
  return {
    entities: {
      ['!Infinity'](rx: URIChargeRx.ValueRx<TValue, TCharge>): TCharge {
        return rx.setValue(Infinity, 'number');
      },

      ['!-Infinity'](rx: URIChargeRx.ValueRx<TValue, TCharge>): TCharge {
        return rx.setValue(-Infinity, 'number');
      },

      ['!NaN']<TCharge>(rx: URIChargeRx.ValueRx<TValue, TCharge>): TCharge {
        return rx.setValue(NaN, 'number');
      },
    },
  };
}
