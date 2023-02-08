import { UcDeserializer } from './uc-deserializer.js';
import { UcdRx } from './ucd-rx.js';

export class UcdReader {

  readonly #reader: ReadableStreamDefaultReader<string>;
  readonly #onError: (error: unknown) => void;

  constructor(stream: ReadableStream<Uint8Array>, options?: UcDeserializer.Options);

  constructor(
    stream: ReadableStream<Uint8Array>,
    { onError = UcDeserializer$throwOnError }: UcDeserializer.Options = {},
  ) {
    this.#reader = stream.pipeThrough(new TextDecoderStream()).getReader();
    this.#onError = onError;
  }

  error(error: unknown): void {
    this.#onError(error);
  }

  async read(_rx: UcdRx): Promise<void> {
    // Read data.
    await Promise.resolve();
  }

  done(): void {
    this.#reader.releaseLock();
  }

}

function UcDeserializer$throwOnError(error: unknown): never {
  throw error;
}
