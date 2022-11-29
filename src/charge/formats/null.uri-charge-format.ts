import { ChURIPrimitive } from '../ch-uri-value.js';
import { URIChargeContext, URIChargeFormat } from '../uri-charge-format.js';

export const NullURIChargeFormat: URIChargeFormat<ChURIPrimitive | null, null> = {
  entities: {
    ['!null']<T extends null>({ consumer }: URIChargeContext<ChURIPrimitive | null, T>): null {
      return consumer.set(null, 'null');
    },
  },
};
