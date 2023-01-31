import { URIChargeRx } from '../uri-charge-rx.js';
import { URIUncharger } from '../uri-uncharger.js';

export class UcEntityParser<out TValue, out TCharge = unknown> {

  readonly #target: URIUncharger.Target<TValue, TCharge>;
  readonly #createUncharger: URIUncharger.Factory<TValue, TCharge>;

  #entities!: Map<string, URIUncharger.EntityHandler<TCharge>>;
  #prefixes?: UcEntity$PrefixHandler<TValue, TCharge>[];

  constructor(
    target: URIUncharger.Target<TValue, TCharge>,
    spec: URIUncharger.Spec<TValue, TCharge>,
  ) {
    this.#target = target;
    this.#createUncharger = URIUncharger(spec);
  }

  #init(): void {
    if (this.#entities) {
      return;
    }

    const uncharger = this.#createUncharger(this.#target);

    this.#initEntityHandlers(uncharger);
    this.#initEntityPrefixes(uncharger);
  }

  #initEntityHandlers({ entities }: URIUncharger<TValue, TCharge>): void {
    this.#entities = new Map();

    if (entities) {
      for (const [rawEntity, handler] of Object.entries(entities)) {
        if (handler) {
          this.#entities.set(rawEntity, handler);
        }
      }
    }
  }

  #initEntityPrefixes({ prefixes }: URIUncharger<TValue, TCharge>): void {
    if (prefixes) {
      const prefixHandlers = new Map<number, UcEntity$PrefixHandler<TValue, TCharge>>();

      for (const [prefix, handler] of Object.entries(prefixes)) {
        if (handler) {
          const prefixLength = prefix.length;
          let prefixHandler = prefixHandlers.get(prefixLength);

          if (!prefixHandler) {
            prefixHandler = new UcEntity$PrefixHandler(prefixLength);
            prefixHandlers.set(prefixLength, prefixHandler);
          }

          prefixHandler.add(prefix, handler);
        }
      }

      if (prefixHandlers.size) {
        this.#prefixes = [...prefixHandlers.values()].sort((first, second) => first.compareTo(second));
      }
    }
  }

  parseEntity(rx: URIChargeRx.ValueRx<TValue, TCharge>, rawEntity: string): void {
    this.#init();

    const handler = this.#entities.get(rawEntity);

    if (handler) {
      rx.add(handler(rawEntity));

      return;
    }

    if (this.#prefixes) {
      for (let i = Math.min(this.#prefixes.length - 1, rawEntity.length); i >= 0; --i) {
        if (this.#prefixes[i].parseEntity(rx, rawEntity)) {
          return;
        }
      }
    }

    rx.addEntity(rawEntity);
  }

}

class UcEntity$PrefixHandler<out TValue, out TCharge> {

  readonly #length: number;
  readonly #handlers = new Map<string, URIUncharger.PrefixHandler<TCharge>>();

  constructor(length: number) {
    this.#length = length;
  }

  add(prefix: string, handler: URIUncharger.PrefixHandler<TCharge>): void {
    this.#handlers.set(prefix, handler);
  }

  parseEntity(rx: URIChargeRx.ValueRx<TValue, TCharge>, rawEntity: string): boolean {
    if (rawEntity.length < this.#length) {
      return false;
    }

    const prefix = rawEntity.slice(0, this.#length);
    const handler = this.#handlers.get(prefix);
    const entity = handler?.(rawEntity.slice(this.#length), prefix);

    if (entity !== undefined) {
      rx.add(entity);

      return true;
    }

    return false;
  }

  compareTo(other: UcEntity$PrefixHandler<TValue, TCharge>): number {
    return this.#length - other.#length;
  }

}
