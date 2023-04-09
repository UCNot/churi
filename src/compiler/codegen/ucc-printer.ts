export class UccPrinter implements UccPrintable, UccPrintSpan {

  readonly #indent: string;
  readonly #records: (string | UccPrintable)[] = [];

  constructor(indent = '') {
    this.#indent = indent;
  }

  print(...records: (string | UccPrintable)[]): this {
    this.#records.push(...records);

    return this;
  }

  indent(print: (printer: UccPrinter) => void, indent = '  '): this {
    const indented = new UccPrinter(indent);

    print(indented);
    this.print(indented);

    return this;
  }

  printTo(span: UccPrintSpan): void {
    if (!this.#indent) {
      span.print(...this.#records);
    } else {
      span.indent(lines => lines.print(...this.#records), this.#indent);
    }
  }

  async toLines(lines: string[] = []): Promise<string[]> {
    this.printTo(new UccPrinter$Span(this.#indent, lines));

    return Promise.resolve(lines);
  }

  async toText(): Promise<string> {
    const lines = await this.toLines();

    return lines.join('');
  }

}

class UccPrinter$Span implements UccPrintSpan {

  readonly #indent: string;
  readonly #lines: string[];

  constructor(indent: string, lines: string[]) {
    this.#indent = indent;
    this.#lines = lines;
  }

  print(...records: (string | UccPrintable)[]): this {
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

  indent(print: (span: UccPrintSpan) => void, indent = '  '): this {
    print(new UccPrinter$Span(`${this.#indent}${indent}`, this.#lines));

    return this;
  }

}

export interface UccPrintable {
  printTo(span: UccPrintSpan): void;
}

export interface UccPrintSpan {
  print(...records: (string | UccPrintable)[]): this;
  indent(print: (span: UccPrintSpan) => void, indent?: string): this;
}
