import { asArray } from '@proc7ts/primitives';
import {
  ChURIDirectiveHandler,
  ChURIEntityHandler,
  ChURIExt,
  ChURIExtHandlerContext,
} from '../ch-uri-ext.js';
import {
  ChURIDirectiveConsumer,
  ChURIListConsumer,
  ChURIMapConsumer,
  ChURIValueConsumer,
} from '../ch-uri-value-consumer.js';
import { ChURIValue } from '../ch-uri-value.js';
import { URIChargeTarget } from './uri-charge-target.js';

export class ChURIExtParser<in out TValue, out TCharge = unknown> {

  readonly #entities = new Map<string, ChURIEntityHandler<TValue>>();
  readonly #directives = new Map<string, ChURIDirectiveHandler<TValue>>();

  constructor(ext: ChURIExt<TValue> | readonly ChURIExt<TValue>[] | undefined) {
    const exts = asArray(ext);

    for (const { entities } of exts) {
      if (entities) {
        for (const [rawEntity, entity] of Object.entries(entities)) {
          this.#entities.set(rawEntity, entity);
        }
      }
    }
    for (const { directives } of exts) {
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
      ? entity(new ChURIExtParserContext(to), rawEntity)
      : to.consumer.set(decodeURIComponent(rawEntity), 'unknown-entity');
  }

  startDirective(
    to: URIChargeTarget<TValue, TCharge>,
    rawName: string,
  ): ChURIDirectiveConsumer<TValue, TCharge> {
    const directive = this.#directives.get(rawName);

    return directive
      ? directive(new ChURIExtParserContext(to), rawName)
      : new UnrecognizedChURIDirectiveConsumer(to, rawName);
  }

}

class ChURIExtParserContext<in out TValue, out TCharge>
  implements ChURIExtHandlerContext<TValue, TCharge> {

  readonly #to: URIChargeTarget<TValue, TCharge>;

  constructor(to: URIChargeTarget<TValue, TCharge>) {
    this.#to = to;
  }

  get consumer(): ChURIValueConsumer<TValue, TCharge> {
    return this.#to.consumer;
  }

}

class UnrecognizedChURIDirectiveConsumer<in out TValue, out TCharge>
  implements ChURIDirectiveConsumer<TValue, TCharge> {

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

  endDirective(): TCharge {
    this.#consumer.endList();

    return this.#hostConsumer.endMap();
  }

}
