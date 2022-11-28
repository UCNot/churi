import { ChURIValueConsumer } from '../ch-uri-value-consumer.js';
import { ChURIPrimitive } from '../ch-uri-value.js';
import { URIChargeFormat } from '../uri-charge-format.js';

export const NullURIChargeFormat: URIChargeFormat<ChURIPrimitive | null, null> = {
  entities: {
    ['!null']<T extends null>(consumer: ChURIValueConsumer<ChURIPrimitive | null, T>): null {
      return consumer.set(null, 'null');
    },
  },
};
