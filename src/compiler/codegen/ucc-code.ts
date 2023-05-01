import { collectLines } from '../impl/collect-lines.js';
import { UccPrintable, UccPrinter } from './ucc-printer.js';

export class UccCode implements UccEmitter {

  static get none(): UccSource {
    return UccCode$none;
  }

  readonly #parent: UccCode | undefined;
  readonly #parts: UccEmitter[] = [];
  #addPart: (part: UccEmitter) => void;

  constructor(parent?: UccCode) {
    this.#parent = parent;
    this.#addPart = this.#doAddPart;
  }

  #doAddPart(part: UccEmitter): void {
    this.#parts.push(part);
  }

  write(...fragments: UccSource[]): this {
    if (fragments.length) {
      for (const fragment of fragments) {
        this.#addFragment(fragment);
      }
    } else {
      fragments.push(UccCode$NewLine);
    }

    return this;
  }

  #addFragment(fragment: UccSource): void {
    if (typeof fragment === 'function') {
      const code = new UccCode(this);

      this.#addPart({
        async emit(): Promise<UccPrintable> {
          await fragment(code);

          return await code.emit();
        },
      });
    } else if (isUccPrintable(fragment)) {
      if (fragment instanceof UccCode && fragment.#contains(this)) {
        throw new TypeError('Can not insert code fragment into itself');
      }
      this.#addPart(fragment);
    } else if (isUccFragment(fragment)) {
      this.#addFragment(fragment.toCode());
    } else if (fragment === '') {
      this.#addPart(UccCode$NewLine);
    } else {
      this.#addPart(new UccCode$Record(fragment));
    }
  }

  #contains(fragment: UccCode): boolean {
    for (;;) {
      if (fragment === this) {
        return true;
      }
      if (!fragment.#parent) {
        return false;
      }

      fragment = fragment.#parent;
    }
  }

  inline(...fragments: UccSource[]): this {
    this.#addPart(new UccCode$Inline(new UccCode(this).write(...fragments)));

    return this;
  }

  indent(...fragments: UccSource[]): this {
    this.#addPart(new UccCode$Indented(new UccCode(this).write(...fragments)));

    return this;
  }

  block(...fragments: UccSource[]): this {
    this.#addPart(new UccCode$Indented(new UccCode(this).write(...fragments), ''));

    return this;
  }

  async emit(): Promise<UccPrintable> {
    const extraRecords: (string | UccPrintable)[] = [];
    let whenEmitted: Promise<unknown> = Promise.resolve();

    this.#addPart = part => {
      this.#doAddPart(part);

      whenEmitted = Promise.all([
        whenEmitted,
        (async () => {
          extraRecords.push(await part.emit());
        })(),
      ]);
    };

    const records = await Promise.all(this.#parts.map(async part => await part.emit()));

    return Promise.resolve({
      printTo: async span => {
        this.#addPart = () => {
          throw new TypeError('Code printed already');
        };

        await whenEmitted;

        if (records.length) {
          span.print(...records);
        }
        if (extraRecords.length) {
          span.print(...extraRecords);
        }
      },
    });
  }

  async *lines(): AsyncIterableIterator<string> {
    yield* new UccPrinter().print(await this.emit()).lines();
  }

  async toLines(): Promise<string[]> {
    return await collectLines(this.lines());
  }

  async toText(): Promise<string> {
    const lines = await this.toLines();

    return lines.join('');
  }

}

export interface UccEmitter {
  emit(): string | UccPrintable | PromiseLike<string | UccPrintable>;
}

export type UccBuilder = (this: void, code: UccCode) => void | PromiseLike<void>;

export interface UccFragment {
  toCode(): UccSource;
}

export type UccSource = string | UccPrintable | UccEmitter | UccFragment | UccBuilder;

function isUccPrintable(source: UccSource): source is UccEmitter {
  return typeof source === 'object' && 'emit' in source && typeof source.emit === 'function';
}

function isUccFragment(source: UccSource): source is UccFragment {
  return typeof source === 'object' && 'toCode' in source && typeof source.toCode === 'function';
}

function UccCode$none(_code: UccCode): void {
  // No code.
}

class UccCode$Record implements UccEmitter {

  readonly #record: UccPrintable | string;

  constructor(record: UccPrintable | string) {
    this.#record = record;
  }

  emit(): string | UccPrintable {
    return this.#record;
  }

}

class UccCode$NewLine$ implements UccEmitter {

  emit(): this {
    return this;
  }

  printTo(lines: UccPrinter): void {
    lines.print();
  }

}

const UccCode$NewLine = /*#__PURE__*/ new UccCode$NewLine$();

class UccCode$Inline implements UccEmitter {

  readonly #code: UccCode;

  constructor(code: UccCode) {
    this.#code = code;
  }

  async emit(): Promise<UccPrintable> {
    const record = await this.#code.emit();

    return {
      printTo: span => {
        span.inline(span => span.print(record));
      },
    };
  }

}

class UccCode$Indented implements UccEmitter {

  readonly #code: UccCode;
  readonly #indent: string | undefined;

  constructor(code: UccCode, indent?: string) {
    this.#code = code;
    this.#indent = indent;
  }

  async emit(): Promise<UccPrintable> {
    const record = await this.#code.emit();

    return {
      printTo: span => {
        span.indent(span => span.print(record), this.#indent);
      },
    };
  }

}
