export class TextOutStream extends WritableStream<Uint8Array> {

  static read(reader: (to: TextOutStream) => void | PromiseLike<void>): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = new TextOutStream({
        abort(reason: unknown) {
          reject(reason);
        },
        close() {
          resolve(stream.toString());
        },
      });

      Promise.resolve()
        .then(async () => {
          await reader(stream);
          await stream.close();
        })
        .catch(reject);
    });
  }

  readonly #decoder = new TextDecoder();
  #text = '';

  constructor(sink?: UnderlyingSink<Uint8Array>) {
    super({
      ...sink,
      write: chunk => this.#write(chunk),
    });
  }

  #write(chunk: Uint8Array): void {
    this.#text += this.#decoder.decode(chunk);
  }

  toString(): string {
    return this.#text;
  }

}
