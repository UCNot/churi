import { Ucrx } from '../rx/ucrx.js';
import { UcDeserializer } from '../schema/uc-deserializer.js';
import { UcLexer } from '../syntax/uc-lexer.js';
import { UcToken } from '../syntax/uc-token.js';
import { ucdReadValueSync } from './impl/ucd-read-value.sync.js';
import { UcrxHandle } from './impl/ucrx-handle.js';
import { UcdReader } from './ucd-reader.js';

export class SyncUcdReader extends UcdReader {

  readonly #tokens: readonly UcToken[];
  #current = -1;
  #next = 0;
  #consumed = 0;

  constructor(tokens: readonly UcToken[], options?: UcDeserializer.Options) {
    super(options);
    this.#tokens = tokens;
  }

  override hasNext(): boolean {
    return this.#next < this.#tokens.length;
  }

  override current(): UcToken | undefined {
    return this.#current < this.#next ? this.#tokens[this.#current] : undefined;
  }

  override hasPrev(): boolean {
    return this.#consumed < this.#current;
  }

  override prev(): UcToken[] {
    return this.hasPrev() ? this.#tokens.slice(this.#consumed, this.#current) : [];
  }

  override read(rx: Ucrx): void {
    ucdReadValueSync(this, new UcrxHandle(this, rx, [{}]), rx => rx.end());
  }

  override next(): UcToken | undefined {
    if (this.#next < this.#tokens.length) {
      this.#current = this.#next++;

      return this.#tokens[this.#current];
    }

    return;
  }

  override find(matcher: (token: UcToken) => boolean | null | undefined): UcToken | undefined {
    if (this.#current < 0) {
      this.#current = this.#next++;
    } else if (this.#current === this.#next && ++this.#next >= this.#tokens.length) {
      this.#next = this.#tokens.length;
    }

    while (this.#current < this.#tokens.length) {
      const token = this.#tokens[this.#current];
      const match = matcher(token);

      if (match != null) {
        return match ? token : undefined;
      }

      this.#current = this.#next++;
    }

    return;
  }

  override consume(): UcToken[] {
    if (this.#consumed < this.#next) {
      const consumed = this.#tokens.slice(this.#consumed, this.#next);

      this.#consumed = this.#current = this.#next;

      return consumed;
    }

    return [];
  }

  override consumePrev(): UcToken[] {
    if (this.#consumed < this.#current) {
      const consumed = this.prev();

      this.#consumed = this.#current;

      return consumed;
    }

    return [];
  }

  override skip(): void {
    if (this.#consumed < this.#next) {
      this.#consumed = this.#current = this.#next;
    }
  }

  override omitPrev(): void {
    if (this.#consumed < this.#current) {
      this.#consumed = this.#current;
    }
  }

  override done(): void {
    // Nothing to do.
  }

}

export function createSyncUcdReader(
  input: string | readonly UcToken[],
  options?: UcDeserializer.Options,
): SyncUcdReader;

export function createSyncUcdReader(
  input: string | readonly UcToken[] | unknown,
  options?: UcDeserializer.Options,
): SyncUcdReader | undefined;

export function createSyncUcdReader(
  input: string | readonly UcToken[] | unknown,
  options?: UcDeserializer.Options,
): SyncUcdReader | undefined {
  if (typeof input === 'string') {
    return new SyncUcdReader(UcLexer.scan(input), options);
  }
  if (Array.isArray(input)) {
    return new SyncUcdReader(input, options);
  }

  return;
}
