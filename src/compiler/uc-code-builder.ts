export class UcCodeBuilder implements Iterable<string> {

  readonly #code: string[] = [];
  #indent = '';

  write(...code: (string | Iterable<string>)[]): this {
    for (const src of code) {
      if (typeof src === 'string') {
        this.#code.push(`${this.#indent}${code}`);
      } else {
        this.write(...[...code]);
      }
    }

    return this;
  }

  indent(write: (code: this) => void): this {
    this.#indent += '  ';
    write(this);
    this.#indent = this.#indent.slice(0, -2);

    return this;
  }

  *[Symbol.iterator](): IterableIterator<string> {
    yield* this.#code;
  }

  toString(): string {
    return this.#code.join(`\n`) + `\n`;
  }

}
