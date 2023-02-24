import { UcError, UcErrorInfo } from '../schema/uc-error.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcTokenizerStream } from '../syntax/uc-tokenizer-stream.js';
import { ucdReadValue } from './impl/ucd-read-value.js';
import { UcDeserializer } from './uc-deserializer.js';
import { UcdRx } from './ucd-rx.js';

export class UcdReader {

  readonly #reader: ReadableStreamDefaultReader<UcToken>;
  readonly #onError: (error: UcErrorInfo) => void;

  #current: UcToken | undefined;
  readonly #prev: UcToken[] = [];
  #hasNext = true;

  constructor(input: ReadableStream<string>, options?: UcDeserializer.Options);

  constructor(
    stream: ReadableStream<string>,
    { onError = UcDeserializer$throwOnError }: UcDeserializer.Options = {},
  ) {
    this.#reader = stream.pipeThrough(new UcTokenizerStream()).getReader();
    this.#onError = onError;
  }

  hasNext(): boolean {
    return this.#hasNext;
  }

  current(): UcToken | undefined {
    return this.#current;
  }

  prev(): readonly UcToken[] {
    return this.#prev;
  }

  error(error: UcErrorInfo): void {
    this.#onError(error);
  }

  async read(rx: UcdRx): Promise<void> {
    await ucdReadValue(this, rx);
  }

  async next(): Promise<UcToken | undefined> {
    if (!this.hasNext()) {
      return;
    }

    const { done, value } = await this.#reader.read();

    this.#push(value);
    if (done) {
      this.#hasNext = false;
      if (value == null) {
        return;
      }
    }

    return this.current();
  }

  #push(token: UcToken | undefined): void {
    const current = this.current();

    if (current) {
      this.#prev.push(current);
    }
    this.#current = token;
  }

  async find(
    matcher: (token: UcToken) => boolean | null | undefined,
  ): Promise<UcToken | undefined> {
    let token = this.current() || (await this.next());

    while (token) {
      const match = matcher(token);

      if (match != null) {
        return match ? token : undefined;
      }

      token = await this.next();
    }

    return;
  }

  consume(): UcToken[] {
    const prev = this.prev();
    const current = this.current();

    if (prev.length) {
      const result = current ? [...prev, current] : prev.slice();

      this.#current = undefined;
      this.#prev.length = 0;

      return result;
    }

    if (current) {
      this.#current = undefined;

      return [current];
    }

    return [];
  }

  consumePrev(): UcToken[] {
    const prev = this.prev();

    if (prev.length) {
      const result: UcToken[] = prev.slice();

      this.#prev.length = 0;

      return result;
    }

    return [];
  }

  skip(): void {
    this.omitPrev();
    this.#current = undefined;
  }

  omitPrev(): void {
    this.#prev.length = 0;
  }

  done(): void {
    this.#reader.releaseLock();
  }

}

function UcDeserializer$throwOnError(error: unknown): never {
  throw UcError.create(error);
}
