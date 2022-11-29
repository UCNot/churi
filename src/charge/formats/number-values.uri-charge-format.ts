import { ChURIPrimitive } from '../ch-uri-value.js';
import { URIChargeContext, URIChargeFormat } from '../uri-charge-format.js';

export const NumberValuesURIChargeFormat: URIChargeFormat = {
  entities: {
    ['!Infinity']: infinityURIChargeEntity,
    ['!-Infinity']: negativeInfinityURIChargeEntity,
    ['!NaN']: nanURIChargeEntity,
  },
};

function infinityURIChargeEntity<TCharge>({
  consumer,
}: URIChargeContext<ChURIPrimitive, TCharge>): TCharge {
  return consumer.set(Infinity, 'number');
}

function negativeInfinityURIChargeEntity<TCharge>({
  consumer,
}: URIChargeContext<ChURIPrimitive, TCharge>): TCharge {
  return consumer.set(-Infinity, 'number');
}

function nanURIChargeEntity<TCharge>({
  consumer,
}: URIChargeContext<ChURIPrimitive, TCharge>): TCharge {
  return consumer.set(NaN, 'number');
}
