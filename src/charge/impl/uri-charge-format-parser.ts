import { asArray } from '@proc7ts/primitives';
import {
  ChURIListConsumer,
  ChURIMapConsumer,
  ChURIValueConsumer,
} from '../ch-uri-value-consumer.js';
import { ChURIValue } from '../ch-uri-value.js';
import {
  URIChargeContext,
  URIChargeDirective,
  URIChargeEntity,
  URIChargeFormat,
} from '../uri-charge-format.js';
import { URIChargeTarget } from './uri-charge-target.js';

export class URIChargeFormatParser<in out TValue, out TCharge = unknown> {

  readonly #entities = new Map<string, URIChargeEntity<TValue>>();
  readonly #directives = new Map<string, URIChargeDirective<TValue>>();

  constructor(format: URIChargeFormat<TValue> | readonly URIChargeFormat<TValue>[] | undefined) {
    const formats = asArray(format);

    for (const { entities } of formats) {
      if (entities) {
        for (const [rawEntity, entity] of Object.entries(entities)) {
          this.#entities.set(rawEntity, entity);
        }
      }
    }
    for (const { directives } of formats) {
      if (directives) {
        for (const [rawName, directive] of Object.entries(directives)) {
          this.#directives.set(rawName, directive);
        }
      }
    }
  }

  addEntity(to: URIChargeTarget<TValue, TCharge>, rawEntity: string): TCharge {
    const entity = this.#entities.get(rawEntity);

    return entity
      ? entity(new URIChargeContext$(to), rawEntity)
      : to.consumer.set(decodeURIComponent(rawEntity), 'unknown-entity');
  }

  startDirective(
    to: URIChargeTarget<TValue, TCharge>,
    rawName: string,
  ): ChURIListConsumer<TValue, TCharge> {
    const directive = this.#directives.get(rawName);

    return directive
      ? directive(new URIChargeContext$(to), rawName)
      : new ChURIUnrecognizedDirectiveConsumer(to, rawName);
  }

}

class URIChargeContext$<in out TValue, out TCharge> implements URIChargeContext<TValue, TCharge> {

  readonly #to: URIChargeTarget<TValue, TCharge>;

  constructor(to: URIChargeTarget<TValue, TCharge>) {
    this.#to = to;
  }

  get consumer(): ChURIValueConsumer<TValue, TCharge> {
    return this.#to.consumer;
  }

}

class ChURIUnrecognizedDirectiveConsumer<in out TValue, out TCharge>
  implements ChURIListConsumer<TValue, TCharge> {

  readonly #hostConsumer: ChURIMapConsumer<TValue, TCharge>;
  readonly #consumer: ChURIListConsumer<TValue>;

  constructor(to: URIChargeTarget<TValue, TCharge>, rawName: string) {
    this.#hostConsumer = to.consumer.startMap();
    this.#consumer = this.#hostConsumer.startList(to.decoder.decodeKey(rawName));
  }

  add(value: ChURIValue<TValue>, type: string): void {
    this.#consumer.add(value, type);
  }

  startMap(): ChURIMapConsumer<TValue> {
    return this.#consumer.startMap();
  }

  startList(): ChURIListConsumer<TValue> {
    return this.#consumer.startList();
  }

  endList(): TCharge {
    this.#consumer.endList();

    return this.#hostConsumer.endMap();
  }

}
