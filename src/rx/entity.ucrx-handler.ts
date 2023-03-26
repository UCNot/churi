import { UcToken } from '../syntax/uc-token.js';
import { EntityPrefixUcrx, EntityUcrx } from './entity.ucrx.js';
import { UcrxContext } from './ucrx-context.js';
import { Ucrx } from './ucrx.js';

export class EntityUcrxHandler {

  readonly #root = new UcdTokenTree();

  rx(context: UcrxContext, rx: Ucrx, entity: readonly UcToken[]): 0 | 1 {
    return this.#root.rx(context, rx, entity, 0);
  }

  addEntity(entity: readonly UcToken[], rx: EntityUcrx): this {
    this.#root.add(entity, 0, rx, false);

    return this;
  }

  addPrefix(entity: readonly UcToken[], rx: EntityPrefixUcrx): this {
    this.#root.add(entity, 0, rx, true);

    return this;
  }

  toRx(): EntityUcrx {
    return this.rx.bind(this);
  }

}

class UcdTokenTree {

  readonly #entityRxs: EntityUcrx[] = [];
  readonly #prefixRxs: EntityPrefixUcrx[] = [];
  readonly #byNumber: { [token: number]: UcdTokenTree | undefined } = {};
  readonly #byString: { [token: string]: UcdTokenTree | undefined } = {};

  readonly #byPrefixLen = new Map<number, UcdEntityPrefix>();
  #prefixes: UcdEntityPrefix[] | null = []; // Sorted by length.

  rx(context: UcrxContext, rx: Ucrx, entity: readonly UcToken[], from: number): 0 | 1 {
    if (from >= entity.length) {
      return this.#onEntity(context, rx, entity) || this.#onPrefix(context, rx, entity, []);
    }

    const token = entity[from];

    if (typeof token === 'number') {
      return (
        this.#byNumber[token]?.rx(context, rx, entity, from + 1)
        || this.#onPrefix(context, rx, entity.slice(0, from), entity.slice(from))
      );
    }

    return (
      this.#byString[token]?.rx(context, rx, entity, from + 1)
      || this.#onStringPrefix(context, rx, entity, from, token)
    );
  }

  #onEntity(context: UcrxContext, rx: Ucrx, entity: readonly UcToken[]): 0 | 1 {
    for (const entityRx of this.#entityRxs) {
      if (entityRx(context, rx, entity)) {
        return 1;
      }
    }

    return 0;
  }

  #onPrefix(
    context: UcrxContext,
    rx: Ucrx,
    prefix: readonly UcToken[],
    args: readonly UcToken[],
  ): 0 | 1 {
    for (const prefixRx of this.#prefixRxs) {
      if (prefixRx(context, rx, prefix, args)) {
        return 1;
      }
    }

    return 0;
  }

  #onStringPrefix(
    context: UcrxContext,
    rx: Ucrx,
    entity: readonly UcToken[],
    from: number,
    token: string,
  ): 0 | 1 {
    if (!this.#prefixes) {
      this.#prefixes = [...this.#byPrefixLen.values()].sort((first, second) => first.compareTo(second));
    }

    for (let i = Math.min(this.#prefixes.length - 1, token.length); i >= 0; --i) {
      if (this.#prefixes[i].rx(context, rx, entity, from, token)) {
        return 1;
      }
    }

    return this.#onPrefix(context, rx, entity.slice(0, from), entity.slice(from));
  }

  add(
    tokens: readonly UcToken[],
    from: number,
    entityRx: EntityUcrx | EntityPrefixUcrx,
    prefix: boolean,
  ): void {
    if (from >= tokens.length) {
      if (prefix) {
        this.#prefixRxs.unshift(entityRx);
      } else {
        this.#entityRxs.unshift(entityRx as EntityUcrx);
      }

      return;
    }

    const token = tokens[from];
    let tree: UcdTokenTree;

    if (typeof token === 'number') {
      const found = this.#byNumber[token];

      if (found) {
        tree = found;
      } else {
        this.#byNumber[token] = tree = new UcdTokenTree();
      }
    } else {
      if (prefix && from === tokens.length - 1) {
        return this.#addPrefix(token, entityRx);
      }

      const found = this.#byString[token];

      if (found) {
        tree = found;
      } else {
        this.#byString[token] = tree = new UcdTokenTree();
      }
    }

    tree.add(tokens, from + 1, entityRx, prefix);
  }

  #addPrefix(prefix: string, prefixRx: EntityPrefixUcrx): void {
    const length = prefix.length;
    let pfx = this.#byPrefixLen.get(length);

    if (!pfx) {
      this.#prefixes = null; // Ensure prefixes re-sorted.
      pfx = new UcdEntityPrefix(length);
      this.#byPrefixLen.set(length, pfx);
    }

    pfx.add(prefix, prefixRx);
  }

}

class UcdEntityPrefix {

  readonly #length: number;
  readonly #prefixRxs: { [prefix: string]: EntityPrefixUcrx[] | undefined } = {};

  constructor(length: number) {
    this.#length = length;
  }

  add(prefix: string, prefixRx: EntityPrefixUcrx): void {
    (this.#prefixRxs[prefix] ??= []).unshift(prefixRx);
  }

  rx(
    context: UcrxContext,
    rx: Ucrx,
    entity: readonly UcToken[],
    from: number,
    token: string,
  ): 0 | 1 {
    const prefix = token.slice(0, this.#length);
    const prefixRxs = this.#prefixRxs[prefix];

    if (prefixRxs) {
      for (const prefixRx of prefixRxs) {
        if (
          prefixRx(
            context,
            rx,
            [...entity.slice(0, from), prefix],
            token.length > this.#length
              ? [token.slice(this.#length), ...entity.slice(from + 1)]
              : entity.slice(from + 1),
          )
        ) {
          return 1;
        }
      }
    }

    return 0;
  }

  compareTo(other: UcdEntityPrefix): number {
    return this.#length - other.#length;
  }

}
