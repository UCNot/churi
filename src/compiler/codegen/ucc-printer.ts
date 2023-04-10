export class UccPrinter implements UccPrintable {

  #indent = '';
  readonly #records: UccPrintRecord[] = [];

  print(...records: (string | UccPrintable)[]): this {
    if (records.length) {
      for (const record of records) {
        if (typeof record === 'string') {
          if (record) {
            this.#records.push([`${this.#indent}${record}\n`]);
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
    this.#records.push([]);
  }

  async #print(printable: UccPrintable): Promise<string[]> {
    const span = new UccPrinter();

    span.#indent = this.#indent;

    await printable.printTo(span);

    return await span.toLines();
  }

  indent(print: (printer: UccPrinter) => void, indent = '  '): this {
    const indented = new UccPrinter();

    indented.#indent = this.#indent + indent;
    print(indented);
    this.print(indented);

    return this;
  }

  printTo(span: UccPrinter): void {
    if (this.#records.length) {
      span.print({
        printTo: async (span: UccPrinter) => {
          const records = await Promise.all(this.#records);

          records.forEach(lines => span.#append(lines));
        },
      });
    }
  }

  #append(lines: string[]): void {
    this.#records.push(lines.map(line => `${this.#indent}${line}`));
  }

  async toLines(): Promise<string[]> {
    const out = await Promise.all(this.#records);
    let prevNL = true;

    return out.flatMap(lines => {
      if (lines.length) {
        prevNL = false;

        return lines;
      }
      if (prevNL) {
        return [];
      }

      prevNL = true;

      return ['\n'];
    });
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
