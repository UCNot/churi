import { UcdMemory } from '../deserializer/ucd-memory.js';

export class UcsWriter {

  readonly #writer: WritableStreamDefaultWriter;
  #whenWritten: Promise<unknown> = Promise.resolve();

  #memory?: UcdMemory;
  #encoder?: TextEncoder;

  constructor(stream: WritableStream<Uint8Array>) {
    this.#writer = stream.getWriter();
  }

  get ready(): Promise<void> {
    return this.#writer.ready;
  }

  get memory(): UcdMemory {
    return (this.#memory ??= new UcdMemory());
  }

  get encoder(): TextEncoder {
    return (this.#encoder ??= new TextEncoder());
  }

  write(chunk: Uint8Array): void {
    this.#startWrite(this.#writer.write(chunk));
  }

  written(): Promise<unknown> {
    return this.#whenWritten;
  }

  #startWrite(written: Promise<void>): void {
    this.#whenWritten = Promise.all([this.#whenWritten, written]);
  }

  async done(): Promise<void> {
    this.#writer.releaseLock();

    await this.#whenWritten;
  }

}
