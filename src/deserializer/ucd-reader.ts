import { ucdReadValue } from './impl/ucd-read-value.js';
import { UcDeserializer } from './uc-deserializer.js';
import { UcdRx } from './ucd-rx.js';

export class UcdReader {

  readonly #reader: ReadableStreamDefaultReader<string>;
  readonly #onError: (error: unknown) => void;

  #current: string | undefined;
  #hasCR = false;
  readonly #prev: string[] = [];
  #hasNext = true;

  constructor(input: ReadableStream<string>, options?: UcDeserializer.Options);

  constructor(
    stream: ReadableStream<string>,
    { onError = UcDeserializer$throwOnError }: UcDeserializer.Options = {},
  ) {
    this.#reader = stream.getReader();
    this.#onError = onError;
  }

  get hasNext(): boolean {
    return this.#hasNext;
  }

  get current(): string | undefined {
    return this.#current;
  }

  get prev(): readonly string[] {
    return this.#prev;
  }

  error(error: unknown): void {
    this.#onError(error);
  }

  async read(rx: UcdRx): Promise<void> {
    await ucdReadValue(this, rx);
  }

  async next(): Promise<string | undefined> {
    if (!this.hasNext) {
      return;
    }

    for (;;) {
      const { done, value } = await this.#reader.read();

      if (done) {
        this.#hasNext = false;
        if (value == null) {
          return;
        }
      }

      if (this.#push(value)) {
        return this.current;
      }
    }
  }

  #push(value: string | undefined): boolean {
    if (!value) {
      // Ignore empty chunk.
      return false;
    }

    let { current } = this;
    let next = value;

    if (this.#hasCR && value.startsWith('\n')) {
      // Handle Windows-style new line that splat between chunks.
      // Append NL to current chunk and remove it from the next one.
      current = current != null ? current + '\n' : '\n';
      if (value.length === 1) {
        // Ignore chunk containing only NL as effectively empty.
        this.#current = current;
        this.#hasCR = false;

        return false;
      }
      next = value.slice(1);
    }
    if (current) {
      this.#prev.push(current);
    }
    this.#current = next;
    this.#hasCR = next.endsWith('\r');

    return true;
  }

  async search(
    searcher: { [Symbol.search](string: string): number } | string | RegExp,
  ): Promise<number> {
    let { current: chunk = await this.next() } = this;

    while (chunk != null) {
      const index = chunk.search(searcher as { [Symbol.search](string: string): number });

      if (index >= 0) {
        return index;
      }

      chunk = await this.next();
    }

    return -1;
  }

  consume(length = -1): string {
    const { current } = this;

    if (current == null) {
      return '';
    }

    let result = this.prev.join('');

    this.#prev.length = 0;
    if (length < 0 || length >= current.length) {
      result += current;
      this.#current = undefined;
    } else {
      result += current.slice(0, length);
      this.#current = current.slice(length);
    }

    return result;
  }

  done(): void {
    this.#reader.releaseLock();
  }

}

function UcDeserializer$throwOnError(error: unknown): never {
  throw error;
}
