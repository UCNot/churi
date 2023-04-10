export class UccPrinter implements UccPrintable {

  #indent = '';
  readonly #records: UccPrintRecord[] = [];

  print(...records: (string | UccPrintable)[]): this {
    if (records.length) {
      for (const record of records) {
        if (typeof record === 'string') {
          if (record) {
            this.#records.push([`${record}\n`]);
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
    this.#records.push(['\n']);
  }

  async #print(printable: UccPrintable): Promise<string[]> {
    const span = new UccPrinter();

    await printable.printTo(span);

    return await span.toLines();
  }

  indent(print: (printer: UccPrinter) => void, indent = '  '): this {
    const indented = new UccPrinter();

    indented.#indent = indent;
    print(indented);
    this.print(indented);

    return this;
  }

  printTo(span: UccPrinter): void {
    if (this.#records.length) {
      span.print({
        printTo: async (span: UccPrinter) => {
          const records = await Promise.all(this.#records);

          records.forEach(lines => span.#append(lines, this.#indent));
        },
      });
    }
  }

  #append(lines: string[], indent: string): void {
    const prefix = this.#indent + indent;

    this.#records.push(
      lines.map(line => (line !== '\n' ? `${prefix}${line}` : line /* Do not indent NL */)),
    );
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
    const lines: string[] = [];

    for await (const line of this.lines()) {
      lines.push(line);
    }

    return lines;
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
