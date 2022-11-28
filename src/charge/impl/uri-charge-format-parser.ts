import { asArray } from '@proc7ts/primitives';
import { URIChargeFormat } from '../uri-charge-format.js';
import { URIChargeTarget } from './uri-charge-target.js';

export class URIChargeFormatParser<in out TValue, out TCharge = unknown> {

  readonly #entities = new Map<string, URIChargeFormat.Entity<TValue, TCharge>>();

  constructor(
    format:
      | URIChargeFormat<TValue, TCharge>
      | readonly URIChargeFormat<TValue, TCharge>[]
      | undefined,
  ) {
    for (const { entities } of asArray(format)) {
      if (entities) {
        for (const [rawKey, entity] of Object.entries(entities)) {
          this.#entities.set(rawKey, entity);
        }
      }
    }
  }

  addEntity({ consumer }: URIChargeTarget<TValue, TCharge>, rawKey: string): TCharge {
    const entity = this.#entities.get(rawKey);

    return entity
      ? entity(consumer, rawKey)
      : consumer.set(decodeURIComponent(rawKey), 'unrecognized-entity');
  }

}
