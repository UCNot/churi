import { asArray } from '@proc7ts/primitives';
import {
  ChURIDirectiveHandler,
  ChURIEntityHandler,
  ChURIExt,
  ChURIExtHandlerContext,
} from '../ch-uri-ext.js';
import { ChURIDirectiveConsumer, ChURIValueConsumer } from '../ch-uri-value-consumer.js';
import { URIChargeTarget } from './uri-charge-target.js';

export class ChURIExtParser<in TValue, out TCharge = unknown> {

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
      : to.consumer.setEntity(rawEntity);
  }

  startDirective(
    to: URIChargeTarget<TValue, TCharge>,
    rawName: string,
  ): ChURIDirectiveConsumer<TValue, TCharge> {
    const directive = this.#directives.get(rawName);

    return directive
      ? directive(new ChURIExtParserContext(to), rawName)
      : to.consumer.startDirective(rawName);
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
