import { UcsMemory } from './ucs-memory.js';

export class UcsWriter {

  readonly #writer: WritableStreamDefaultWriter;
  #whenWritten: Promise<unknown> = Promise.resolve();
  #memory?: UcsMemory;
  #encoder?: TextEncoder;

  constructor(stream: WritableStream<Uint8Array>) {
    this.#writer = stream.getWriter();
  }

  get writer(): WritableStreamDefaultWriter {
    return this.#writer;
  }

  get memory(): UcsMemory {
    return (this.#memory ??= new UcsMemory());
  }

  get encoder(): TextEncoder {
    return (this.#encoder ??= new TextEncoder());
  }

  whenWritten(written: Promise<void>): void {
    this.#whenWritten = Promise.all([this.#whenWritten, written]);
  }

  async done(): Promise<void> {
    this.#writer.releaseLock();

    await this.#whenWritten;
  }

}
