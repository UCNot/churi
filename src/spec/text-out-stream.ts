export class TextOutStream extends WritableStream<Uint8Array> {

  static read(
    reader: (to: TextOutStream) => void | PromiseLike<void>,
    sink?: UnderlyingSink<Uint8Array>,
    strategy?: QueuingStrategy<Uint8Array>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = new this(
        {
          abort(reason: unknown) {
            reject(reason);
          },
          close() {
            resolve(stream.toString());
          },
          ...sink,
        },
        strategy,
      );

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

  constructor(sink?: UnderlyingSink<Uint8Array>, strategy?: QueuingStrategy<Uint8Array>) {
    super(
      {
        write: chunk => this.#write(chunk),
        ...sink,
      },
      strategy,
    );
  }

  #write(chunk: Uint8Array): void {
    this.#text += this.#decoder.decode(chunk);
  }

  toString(): string {
    return this.#text;
  }

}
