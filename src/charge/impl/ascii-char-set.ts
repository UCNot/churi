export class ASCIICharSet {

  readonly #min: number;
  readonly #max: number;
  readonly #mask: number;

  constructor(asciiChars: string /* in ascending order */) {
    const numChars = asciiChars.length;
    const min = (this.#min = asciiChars.charCodeAt(0));

    this.#max = asciiChars.charCodeAt(numChars - 1);

    let mask = 0;

    for (let i = 0; i < numChars; ++i) {
      const code = asciiChars.charCodeAt(i);

      mask |= 1 << (code - min);
    }

    this.#mask = mask;
  }

  prefixes(input: string): number | boolean {
    const firstCode = input.charCodeAt(0);

    return (
      firstCode <= this.#max
      && firstCode >= this.#min
      && this.#mask & (1 << (firstCode - this.#min))
    );

    return 0;
  }

}
