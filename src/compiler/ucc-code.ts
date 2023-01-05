import { UccPrinter } from './ucc-printer.js';

export class UccCode implements UccCode.Fragment {

  readonly #parent?: UccCode;
  readonly #parts: UccCode$Part[] = [];

  constructor(parent?: UccCode) {
    this.#parent = parent;
  }

  write(...fragments: (UccCode.Source<this> | UccCode.Fragment<this>)[]): this {
    if (fragments.length) {
      this.#parts.push(...fragments.map(fragment => this.#createPart(fragment)));
    } else {
      fragments.push(UccCode$NewLine);
    }

    return this;
  }

  #createPart(fragment: UccCode.Source<this> | UccCode.Fragment<this>): UccCode$Part {
    if (isUccCodeFragment(fragment)) {
      if (this.#contains(fragment)) {
        throw new TypeError('Can not insert code fragment into itself');
      }

      return fragment instanceof UccCode ? fragment : new UccCode$Fragment(this, fragment);
    }
    if (typeof fragment === 'function') {
      return new UccCode$Builder(this, fragment);
    }
    if (fragment === '') {
      return UccCode$NewLine;
    }

    return new UccCode$Record(fragment);
  }

  #contains(fragment: UccCode.Fragment): boolean {
    for (;;) {
      if (fragment === this) {
        return true;
      }

      if (fragment instanceof UccCode && fragment.#parent) {
        fragment = fragment.#parent;

        continue;
      }

      return false;
    }
  }

  indent(...fragments: (UccCode.Source | UccCode.Fragment)[]): this {
    this.#parts.push(new UccCode$Indented(new UccCode(this).write(...fragments)));

    return this;
  }

  toCode(): UccCode.Builder {
    return code => code.write(...this.#parts.map(part => part.toCode()));
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
  export type Source<TCode extends UccCode = UccCode> = string | UccPrinter.Record | Builder<TCode>;

  export interface Fragment<out TCode extends UccCode = UccCode> {
    toCode(): Source<TCode>;
  }

  export type Builder<in TCode extends UccCode = UccCode> = {
    buildCode(code: TCode): unknown;
  }['buildCode'];
}

function isUccCodeFragment(source: UccCode.Source | UccCode.Fragment): source is UccCode.Fragment {
  return typeof source === 'object' && 'toCode' in source && typeof source.toCode === 'function';
}

interface UccCode$Part {
  toCode(): UccCode.Source | UccCode.Fragment;
  prePrint(): string | UccPrinter.Record;
}

class UccCode$Record implements UccCode$Part {

  readonly #record: UccPrinter.Record | string;

  constructor(record: UccPrinter.Record | string) {
    this.#record = record;
  }

  toCode(): UccPrinter.Record | string {
    return this.#record;
  }

  prePrint(): string | UccPrinter.Record {
    return this.#record;
  }

}

class UccCode$NewLine$ implements UccCode$Part {

  toCode(): UccPrinter.Record | string {
    return this;
  }

  prePrint(): this {
    return this;
  }

  printTo(lines: UccPrinter.Lines): void {
    lines.print();
  }

}

const UccCode$NewLine = /*#__PURE__*/ new UccCode$NewLine$();

class UccCode$Builder implements UccCode$Part {

  readonly #parent: UccCode;
  readonly #builder: UccCode.Builder;

  constructor(parent: UccCode, builder: UccCode.Builder) {
    this.#parent = parent;
    this.#builder = builder;
  }

  toCode(): UccCode.Source {
    return this.#builder;
  }

  prePrint(): UccPrinter.Record {
    const code = new UccCode(this.#parent);

    this.#builder(code);

    return code.prePrint();
  }

}

class UccCode$Fragment implements UccCode$Part {

  readonly #parent: UccCode;
  readonly #fragment: UccCode.Fragment;

  constructor(parent: UccCode, fragment: UccCode.Fragment) {
    this.#parent = parent;
    this.#fragment = fragment;
  }

  toCode(): UccCode.Fragment {
    return this.#fragment;
  }

  prePrint(): string | UccPrinter.Record {
    const source = this.#fragment.toCode();

    if (typeof source === 'function') {
      const code = new UccCode(this.#parent);

      source(code);

      return code.prePrint();
    }

    return source;
  }

}

class UccCode$Indented implements UccCode$Part {

  readonly #code: UccCode;

  constructor(fragment: UccCode) {
    this.#code = fragment;
  }

  toCode(): UccCode.Fragment {
    return this.#code;
  }

  prePrint(): UccPrinter.Record {
    const record = this.#code.prePrint();

    return { printTo: lines => lines.indent(lines => lines.print(record)) };
  }

}
