import { UccPrinter } from './ucc-printer.js';

export class UccCode {

  readonly #parent?: UccCode;
  readonly #parts: UccCode.Printable[] = [];

  constructor(parent?: UccCode) {
    this.#parent = parent;
  }

  write(...fragments: UccCode.Source<this>[]): this {
    if (fragments.length) {
      for (const fragment of fragments) {
        this.#addFragment(fragment);
      }
    } else {
      fragments.push(UccCode$NewLine);
    }

    return this;
  }

  #addFragment(fragment: UccCode.Source<this>): void {
    if (typeof fragment === 'function') {
      fragment(this);
    } else if (isUccCodePrintable(fragment)) {
      if (fragment instanceof UccCode && fragment.#contains(this)) {
        throw new TypeError('Can not insert code fragment into itself');
      }
      this.#parts.push(fragment);
    } else if (isUccCodeFragment(fragment)) {
      this.#addFragment(fragment.toCode());
    } else if (fragment === '') {
      this.#parts.push(UccCode$NewLine);
    } else {
      this.#parts.push(new UccCode$Record(fragment));
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
    this.#parts.push(new UccCode$Indented(new UccCode(this).write(...fragments)));

    return this;
  }

  prePrint(): UccPrinter.Record {
    const records = this.#parts.map(part => part.prePrint());

    return {
      printTo(lines) {
        lines.print(...records);
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
  export type Source<TCode extends UccCode = UccCode> =
    | string
    | UccPrinter.Record
    | Printable
    | Fragment<TCode>
    | Builder<TCode>;

  export interface Fragment<out TCode extends UccCode = UccCode> {
    toCode(): Source<TCode>;
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
