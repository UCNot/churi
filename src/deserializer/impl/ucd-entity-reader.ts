import { UcdEntityPrefixDef } from '../../compiler/deserialization/ucd-entity-prefix-def.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UcdEntityHandler, UcdEntityPrefixHandler } from '../ucd-entity-handler.js';
import { UcdReader } from '../ucd-reader.js';
import { UcdRx } from '../ucd-rx.js';
import { ucdUnrecognizedEntityError } from './ucd-errors.js';

export class UcdEntityReader {

  readonly #reader: UcdReader;
  readonly #root = new UcdTokenTree();

  constructor(reader: UcdReader) {
    this.#reader = reader;
  }

  read(rx: UcdRx, entity: readonly UcToken[]): void {
    this.#root.read(this.#reader, rx, entity, 0);
  }

  addEntity(entity: readonly UcToken[], handler: UcdEntityHandler): void {
    this.#root.add(entity, 0, handler, false);
  }

  addPrefix(entity: readonly UcToken[], handler: UcdEntityPrefixHandler): void {
    this.#root.add(entity, 0, handler, true);
  }

}

class UcdTokenTree {

  #onEntity: UcdEntityHandler | undefined;
  #onPrefix: UcdEntityPrefixHandler | undefined;
  readonly #byNumber: { [token: number]: UcdTokenTree | undefined } = {};
  readonly #byString: { [token: string]: UcdTokenTree | undefined } = {};

  readonly #byPrefixLen = new Map<number, UcdEntityPrefix>();
  #prefixes: UcdEntityPrefix[] | null = []; // Sorted by length.

  read(reader: UcdReader, rx: UcdRx, entity: readonly UcToken[], from: number): void {
    if (from >= entity.length) {
      if (this.#onEntity) {
        this.#onEntity(reader, rx, entity);
      } else if (this.#onPrefix) {
        this.#onPrefix(reader, rx, entity, []);
      } else {
        reader.error(ucdUnrecognizedEntityError(entity));
      }

      return;
    }

    const token = entity[from];

    if (typeof token === 'number') {
      const nested = this.#byNumber[token];

      if (nested) {
        nested.read(reader, rx, entity, from + 1);
      } else if (this.#onPrefix) {
        this.#onPrefix(reader, rx, entity.slice(0, from), entity.slice(from));
      } else {
        reader.error(ucdUnrecognizedEntityError(entity));
      }

      return;
    }

    const nested = this.#byString[token];

    if (nested) {
      return nested.read(reader, rx, entity, from + 1);
    }

    this.#readPrefix(reader, rx, entity, from, token);
  }

  #readPrefix(
    reader: UcdReader,
    rx: UcdRx,
    entity: readonly UcToken[],
    from: number,
    token: string,
  ): UcdEntityPrefixDef | undefined {
    if (!this.#prefixes) {
      this.#prefixes = [...this.#byPrefixLen.values()].sort((first, second) => first.compareTo(second));
    }

    for (let i = Math.min(this.#prefixes.length - 1, token.length); i >= 0; --i) {
      const handled = this.#prefixes[i].read(reader, rx, entity, from, token);

      if (handled) {
        return;
      }
    }

    if (this.#onPrefix) {
      this.#onPrefix(reader, rx, entity.slice(0, from), entity.slice(from));
    } else {
      reader.error(ucdUnrecognizedEntityError(entity));
    }

    return;
  }

  add(
    tokens: readonly UcToken[],
    from: number,
    handler: UcdEntityHandler | UcdEntityPrefixHandler,
    prefix: boolean,
  ): void {
    if (from >= tokens.length) {
      if (prefix) {
        this.#onPrefix = handler;
      } else {
        this.#onEntity = handler as UcdEntityHandler;
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
        return this.#addPrefix(token, handler);
      }

      const found = this.#byString[token];

      if (found) {
        tree = found;
      } else {
        this.#byString[token] = tree = new UcdTokenTree();
      }
    }

    tree.add(tokens, from + 1, handler, prefix);
  }

  #addPrefix(prefix: string, handler: UcdEntityPrefixHandler): void {
    const length = prefix.length;
    let pfx = this.#byPrefixLen.get(length);

    if (!pfx) {
      this.#prefixes = null; // Ensure prefixes re-sorted.
      pfx = new UcdEntityPrefix(length);
      this.#byPrefixLen.set(length, pfx);
    }

    pfx.add(prefix, handler);
  }

}

class UcdEntityPrefix {

  readonly #length: number;
  readonly #handlers: { [prefix: string]: UcdEntityPrefixHandler | undefined } = {};

  constructor(length: number) {
    this.#length = length;
  }

  add(prefix: string, handler: UcdEntityPrefixHandler): void {
    this.#handlers[prefix] = handler;
  }

  read(
    reader: UcdReader,
    rx: UcdRx,
    entity: readonly UcToken[],
    from: number,
    token: string,
  ): boolean {
    const prefix = token.slice(0, this.#length);
    const handler = this.#handlers[prefix];

    if (handler) {
      handler(
        reader,
        rx,
        [...entity.slice(0, from), prefix],
        token.length > this.#length
          ? [token.slice(this.#length), ...entity.slice(from + 1)]
          : entity.slice(from + 1),
      );

      return true;
    }

    return false;
  }

  compareTo(other: UcdEntityPrefix): number {
    return this.#length - other.#length;
  }

}
