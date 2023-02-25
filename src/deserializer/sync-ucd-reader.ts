import { UcToken } from '../syntax/uc-token.js';
import { AbstractUcdReader } from './abstract-ucd-reader.js';
import { UcDeserializer } from './uc-deserializer.js';
import { UcdRx } from './ucd-rx.js';

export class SyncUcdReader extends AbstractUcdReader {

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
    return this.#current < this.#tokens.length ? this.#tokens[this.#current] : undefined;
  }

  override prev(): UcToken[] {
    return this.#consumed < this.#current ? this.#tokens.slice(this.#consumed, this.#current) : [];
  }

  /* istanbul ignore next */
  override read(_rx: UcdRx): void {
    // TODO Read synchronously
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
    if (this.#current < this.#next) {
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
