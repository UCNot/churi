import { ChURIExt, ChURIExtHandlerContext } from '../ch-uri-ext.js';
import { ChURIPrimitive } from '../ch-uri-value.js';

export const NumberValuesChURIExt: ChURIExt = {
  entities: {
    ['!Infinity']<TCharge>({ consumer }: ChURIExtHandlerContext<ChURIPrimitive, TCharge>): TCharge {
      return consumer.set(Infinity, 'number');
    },

    ['!-Infinity']<TCharge>({
      consumer,
    }: ChURIExtHandlerContext<ChURIPrimitive, TCharge>): TCharge {
      return consumer.set(-Infinity, 'number');
    },

    ['!NaN']<TCharge>({ consumer }: ChURIExtHandlerContext<ChURIPrimitive, TCharge>): TCharge {
      return consumer.set(NaN, 'number');
    },
  },
};
