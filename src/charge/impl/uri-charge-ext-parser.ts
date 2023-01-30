import { URIChargeExt } from '../uri-charge-ext.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export class URIChargeExtParser<out TValue, out TCharge = unknown> {

  readonly #target: URIChargeExt.Target<TValue, TCharge>;
  readonly #createExt: URIChargeExt.Factory<TValue, TCharge>;

  #entities!: Map<string, URIChargeExt.EntityHandler<TCharge>>;
  #prefixes?: UcEntity$PrefixHandler<TValue, TCharge>[];

  constructor(
    target: URIChargeExt.Target<TValue, TCharge>,
    spec: URIChargeExt.Spec<TValue, TCharge> | undefined,
  ) {
    this.#target = target;
    this.#createExt = URIChargeExt(spec);
  }

  #init(): void {
    if (this.#entities) {
      return;
    }

    const ext = this.#createExt(this.#target);

    this.#initEntityHandlers(ext);
    this.#initEntityPrefixes(ext);
  }

  #initEntityHandlers({ entities }: URIChargeExt<TValue, TCharge>): void {
    this.#entities = new Map();

    if (entities) {
      for (const [rawEntity, handler] of Object.entries(entities)) {
        if (handler) {
          this.#entities.set(rawEntity, handler);
        }
      }
    }
  }

  #initEntityPrefixes({ prefixes }: URIChargeExt<TValue, TCharge>): void {
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
  readonly #handlers = new Map<string, URIChargeExt.PrefixHandler<TCharge>>();

  constructor(length: number) {
    this.#length = length;
  }

  add(prefix: string, handler: URIChargeExt.PrefixHandler<TCharge>): void {
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
