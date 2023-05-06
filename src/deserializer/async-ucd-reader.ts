import { Ucrx } from '../rx/ucrx.js';
import { UcDeserializer } from '../schema/uc-deserializer.js';
import { UcToken } from '../syntax/uc-token.js';
import { ucdReadValue } from './impl/ucd-read-value.js';
import { UcrxHandle } from './impl/ucrx-handle.js';
import { UcdReader } from './ucd-reader.js';

export class AsyncUcdReader extends UcdReader {

  readonly #reader: ReadableStreamDefaultReader<UcToken>;

  #current: UcToken | undefined;
  readonly #prev: UcToken[] = [];
  #hasNext = true;

  constructor(stream: ReadableStream<UcToken>, options?: UcDeserializer.Options) {
    super(options);
    this.#reader = stream.getReader();
  }

  override hasNext(): boolean {
    return this.#hasNext;
  }

  override current(): UcToken | undefined {
    return this.#current;
  }

  override hasPrev(): boolean {
    return this.#prev.length > 0;
  }

  override prev(): readonly UcToken[] {
    return this.#prev;
  }

  override async read(rx: Ucrx): Promise<void> {
    await ucdReadValue(this, new UcrxHandle(this, rx, [{}]), rx => rx.end());
  }

  override async next(): Promise<UcToken | undefined> {
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

  override async find(
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

  override consume(): UcToken[] {
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

  override consumePrev(): UcToken[] {
    const prev = this.prev();

    if (prev.length) {
      const result: UcToken[] = prev.slice();

      this.#prev.length = 0;

      return result;
    }

    return [];
  }

  override skip(): void {
    this.omitPrev();
    this.#current = undefined;
  }

  override omitPrev(): void {
    this.#prev.length = 0;
  }

  override done(): void {
    this.#reader.releaseLock();
  }

}
