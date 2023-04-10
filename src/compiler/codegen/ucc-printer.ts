import { collectLines } from '../impl/collect-lines.js';

export class UccPrinter implements UccPrintable {

  #indent = '';
  #nl = '\n';
  readonly #records: UccPrintRecord[] = [];

  print(...records: (string | UccPrintable)[]): this {
    if (records.length) {
      for (const record of records) {
        if (typeof record === 'string') {
          if (record) {
            this.#records.push([`${record}${this.#nl}`]);
          } else {
            this.#newLine();
          }
        } else {
          this.#records.push(this.#print(record));
        }
      }
    } else {
      this.#newLine();
    }

    return this;
  }

  #newLine(): void {
    if (this.#nl) {
      this.#records.push([this.#nl]);
    }
  }

  async #print(printable: UccPrintable): Promise<string[]> {
    const span = new UccPrinter();

    span.#nl = this.#nl;
    await printable.printTo(span);

    return await span.toLines();
  }

  inline(print: (span: UccPrinter) => void): this {
    const inline = new UccPrinter();

    inline.#nl = '';
    print(inline);
    this.print(inline);

    return this;
  }

  indent(print: (span: UccPrinter) => void, indent = '  '): this {
    const indented = new UccPrinter();

    indented.#indent = indent;
    print(indented);
    this.print(indented);

    return this;
  }

  printTo(span: UccPrinter): void {
    if (this.#records.length) {
      span.print({
        printTo: this.#printTo.bind(this),
      });
    }
  }

  async #printTo(span: UccPrinter): Promise<void> {
    const records = await Promise.all(this.#records);

    if (this.#nl) {
      records.forEach(lines => span.#appendLines(lines, this));
    } else {
      span.#appendLine(records.map(lines => lines.join('')).join(''));
    }
  }

  #appendLines(lines: string[], from: UccPrinter): void {
    const prefix = this.#indent + from.#indent;

    this.#records.push(
      lines.map(line => (line !== '\n' ? `${prefix}${line}` : line) /* Do not indent NL */),
    );
  }

  #appendLine(line: string): void {
    this.#records.push([`${this.#indent}${line}${this.#nl}`]);
  }

  async *lines(): AsyncIterableIterator<string> {
    const records = await Promise.all(this.#records);
    let prevNL = false;

    for (const lines of records) {
      for (const line of lines) {
        if (line !== '\n') {
          yield line;
          prevNL = false;
        } else if (!prevNL) {
          yield line;
          prevNL = true;
        }
      }
    }
  }

  async toLines(): Promise<string[]> {
    return await collectLines(this.lines());
  }

  async toText(): Promise<string> {
    const lines = await this.toLines();

    return lines.join('');
  }

}

export interface UccPrintable {
  printTo(span: UccPrinter): void | PromiseLike<void>;
}

type UccPrintRecord = string[] | Promise<string[]>;
