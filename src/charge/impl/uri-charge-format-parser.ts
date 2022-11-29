import { asArray } from '@proc7ts/primitives';
import {
  ChURIArrayConsumer,
  ChURIObjectConsumer,
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

  readonly #entities = new Map<string, URIChargeEntity<TValue, TCharge>>();
  readonly #directives = new Map<string, URIChargeDirective<TValue, TCharge>>();

  constructor(
    format:
      | URIChargeFormat<TValue, TCharge>
      | readonly URIChargeFormat<TValue, TCharge>[]
      | undefined,
  ) {
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
  ): ChURIArrayConsumer<TValue, TCharge> {
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

  decode(input: string): TCharge {
    return this.#to.decode(input);
  }

}

class ChURIUnrecognizedDirectiveConsumer<in out TValue, out TCharge> extends ChURIArrayConsumer<
  TValue,
  TCharge
> {

  readonly #hostConsumer: ChURIObjectConsumer<TValue, TCharge>;
  readonly #consumer: ChURIArrayConsumer<TValue>;

  constructor(to: URIChargeTarget<TValue, TCharge>, rawName: string) {
    super();
    this.#hostConsumer = to.consumer.startObject();
    this.#consumer = this.#hostConsumer.startArray(to.decoder.decodeKey(rawName));
  }

  override add(value: ChURIValue<TValue>, type: string): void {
    this.#consumer.add(value, type);
  }

  override startObject(): ChURIObjectConsumer<TValue> {
    return this.#consumer.startObject();
  }

  override startArray(): ChURIArrayConsumer<TValue> {
    return this.#consumer.startArray();
  }

  override endArray(): TCharge {
    this.#consumer.endArray();

    return this.#hostConsumer.endObject();
  }

}
