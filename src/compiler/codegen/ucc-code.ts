import { UccPrinter } from './ucc-printer.js';

export class UccCode implements UccCode.Printable {

  static get none(): UccCode.Source {
    return UccCode$none;
  }

  readonly #parent?: UccCode;
  readonly #parts: UccCode.Printable[] = [];
  #addPart: (part: UccCode.Printable) => void;

  constructor(parent?: UccCode) {
    this.#parent = parent;
    this.#addPart = part => this.#parts.push(part);
  }

  write(...fragments: UccCode.Source[]): this {
    if (fragments.length) {
      for (const fragment of fragments) {
        this.#addFragment(fragment);
      }
    } else {
      fragments.push(UccCode$NewLine);
    }

    return this;
  }

  #addFragment(fragment: UccCode.Source): void {
    if (typeof fragment === 'function') {
      const code = new UccCode(this);

      fragment(code as this);

      this.#addPart(code);
    } else if (isUccCodePrintable(fragment)) {
      if (fragment instanceof UccCode && fragment.#contains(this)) {
        throw new TypeError('Can not insert code fragment into itself');
      }
      this.#addPart(fragment);
    } else if (isUccCodeFragment(fragment)) {
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

  indent(...fragments: UccCode.Source[]): this {
    this.#addPart(new UccCode$Indented(new UccCode(this).write(...fragments)));

    return this;
  }

  prePrint(): UccPrinter.Record {
    const records = this.#parts.map(part => part.prePrint());
    const addPart = this.#addPart;

    this.#addPart = part => {
      addPart(part);
      records.push(part.prePrint());
    };

    return {
      printTo: lines => {
        if (records.length) {
          lines.print(...records);
        }
      },
    };
  }

  toLines(lines?: string[]): string[] {
    return new UccPrinter().print(this.prePrint()).toLines(lines);
  }

  toString(): string {
    return this.toLines().join('');
  }

}

export namespace UccCode {
  export type Source = string | UccPrinter.Record | Printable | Fragment | Builder;

  export interface Fragment {
    toCode(): Source;
  }

  export interface Printable {
    prePrint(): string | UccPrinter.Record;
  }

  export type Builder<in TCode extends UccCode = UccCode> = {
    buildCode(code: TCode): unknown;
  }['buildCode'];
}

function isUccCodePrintable(source: UccCode.Source): source is UccCode.Printable {
  return (
    typeof source === 'object' && 'prePrint' in source && typeof source.prePrint === 'function'
  );
}

function isUccCodeFragment(source: UccCode.Source): source is UccCode.Fragment {
  return typeof source === 'object' && 'toCode' in source && typeof source.toCode === 'function';
}

function UccCode$none(_code: UccCode): void {
  // No code.
}

class UccCode$Record implements UccCode.Printable {

  readonly #record: UccPrinter.Record | string;

  constructor(record: UccPrinter.Record | string) {
    this.#record = record;
  }

  prePrint(): string | UccPrinter.Record {
    return this.#record;
  }

}

class UccCode$NewLine$ implements UccCode.Printable {

  prePrint(): this {
    return this;
  }

  printTo(lines: UccPrinter.Lines): void {
    lines.print();
  }

}

const UccCode$NewLine = /*#__PURE__*/ new UccCode$NewLine$();

class UccCode$Indented implements UccCode.Printable {

  readonly #code: UccCode;

  constructor(fragment: UccCode) {
    this.#code = fragment;
  }

  prePrint(): UccPrinter.Record {
    const record = this.#code.prePrint();

    return { printTo: lines => lines.indent(lines => lines.print(record)) };
  }

}
