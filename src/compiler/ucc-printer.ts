export class UccPrinter implements UccPrinter.Record, UccPrinter.Lines {

  readonly #indent: string;
  readonly #records: (string | UccPrinter.Record)[] = [];

  constructor(indent = '') {
    this.#indent = indent;
  }

  print(...records: (string | UccPrinter.Record)[]): this {
    this.#records.push(...records);

    return this;
  }

  indent(print: (printer: UccPrinter) => void, indent = '  '): this {
    const indented = new UccPrinter(indent);

    print(indented);
    this.print(indented);

    return this;
  }

  printTo(lines: UccPrinter.Lines): void {
    if (!this.#indent) {
      lines.print(...this.#records);
    } else {
      lines.indent(lines => lines.print(...this.#records), this.#indent);
    }
  }

  toLines(lines: string[] = []): string[] {
    this.printTo(new UccPrinter$Lines(this.#indent, lines));

    return lines;
  }

  toString(): string {
    return this.toLines().join('');
  }

}

class UccPrinter$Lines implements UccPrinter.Lines {

  readonly #indent: string;
  readonly #lines: string[];

  constructor(indent: string, lines: string[]) {
    this.#indent = indent;
    this.#lines = lines;
  }

  print(...records: (string | UccPrinter.Record)[]): this {
    if (records.length) {
      for (const record of records) {
        if (typeof record === 'string') {
          if (record) {
            this.#lines.push(`${this.#indent}${record}\n`);
          } else {
            this.#newLine();
          }
        } else {
          record.printTo(this);
        }
      }
    } else {
      this.#newLine();
    }

    return this;
  }

  #newLine(): void {
    if (this.#lines.length && this.#lines[this.#lines.length - 1] !== '\n') {
      this.#lines.push('\n');
    }
  }

  indent(print: (printer: UccPrinter.Lines) => void, indent = '  '): this {
    print(new UccPrinter$Lines(`${this.#indent}${indent}`, this.#lines));

    return this;
  }

}

export namespace UccPrinter {
  export interface Record {
    printTo(lines: UccPrinter.Lines): void;
  }

  export interface Lines {
    print(...records: (string | UccPrinter.Record)[]): this;
    indent(print: (lines: UccPrinter.Lines) => void, indent?: string): this;
  }
}
