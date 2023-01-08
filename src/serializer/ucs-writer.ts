import { UrtMemory } from '../runtime/urt-memory.js';

export class UcsWriter {

  readonly #writer: WritableStreamDefaultWriter;
  #whenWritten: Promise<unknown> = Promise.resolve();

  #memory?: UrtMemory;
  #encoder?: TextEncoder;

  constructor(stream: WritableStream<Uint8Array>) {
    this.#writer = stream.getWriter();
  }

  get ready(): Promise<void> {
    return this.#writer.ready;
  }

  get memory(): UrtMemory {
    return (this.#memory ??= new UrtMemory());
  }

  get encoder(): TextEncoder {
    return (this.#encoder ??= new TextEncoder());
  }

  write(chunk: Uint8Array): void {
    this.whenWritten(this.#writer.write(chunk));
  }

  whenWritten(written: Promise<void>): void {
    this.#whenWritten = Promise.all([this.#whenWritten, written]);
  }

  async done(): Promise<void> {
    this.#writer.releaseLock();

    await this.#whenWritten;
  }

}
