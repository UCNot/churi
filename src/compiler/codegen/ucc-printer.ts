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
    if (this.#records.length) {
      if (this.#indent) {
        span.indent(span => span.print(...this.#records), this.#indent);
      } else {
        span.print(...this.#records);
      }
    }
  }

  async toLines(): Promise<string[]> {
    const lines = await toUccPrintRecord(this.#indent, this);

    if (lines.length && lines[0] === '\n') {
      return lines.slice(1);
    }

    return lines;
  }

  async toText(): Promise<string> {
    const lines = await this.toLines();

    return lines.join('');
  }

}

class UccPrinter$Span implements UccPrintSpan {

  readonly #indent: string;
  readonly #records: UccPrintRecord[];

  constructor(indent: string, records: UccPrintRecord[]) {
    this.#indent = indent;
    this.#records = records;
  }

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
          this.#records.push(toUccPrintRecord(this.#indent, record));
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

  indent(print: (span: UccPrintSpan) => void, indent = '  '): this {
    print(new UccPrinter$Span(`${this.#indent}${indent}`, this.#records));

    return this;
  }

}

export interface UccPrintable {
  printTo(span: UccPrintSpan): void | PromiseLike<void>;
}

export interface UccPrintSpan {
  print(...records: (string | UccPrintable)[]): this;
  indent(print: (span: UccPrintSpan) => void, indent?: string): this;
}

type UccPrintRecord = string[] | Promise<string[]>;

async function toUccPrintRecord(indent: string, record: UccPrintable): Promise<string[]> {
  const spanRecords: UccPrintRecord[] = [];
  const span = new UccPrinter$Span(indent, spanRecords);

  await record.printTo(span);

  return await uccPrintRecords(spanRecords);
}

async function uccPrintRecords(records: UccPrintRecord[]): Promise<string[]> {
  const out = await Promise.all(records);
  let prevNL = false;

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
