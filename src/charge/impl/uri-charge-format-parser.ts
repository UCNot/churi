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

  addEntity({ consumer }: URIChargeTarget<TValue, TCharge>, rawEntity: string): TCharge {
    const entity = this.#entities.get(rawEntity);

    return entity
      ? entity(consumer, rawEntity)
      : consumer.set(decodeURIComponent(rawEntity), 'unrecognized-entity');
  }

}
