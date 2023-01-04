export class UccCode implements UccCode.Fragment {

  readonly #parts: UccCode$Part[] = [];
  readonly #indent: string;

  constructor(parent?: UccCode) {
    this.#indent = parent ? parent.#indent + '  ' : '';
  }

  write(...fragments: (UccCode.Source<this> | UccCode.Fragment<this>)[]): this {
    for (const fragment of fragments) {
      if (typeof fragment === 'string') {
        this.#parts.push(new UccCode$Line(`${this.#indent}${fragments}\n`));
      } else {
        this.#parts.push(
          new UccCode$Fragment(
            this,
            typeof fragment === 'function'
              ? fragment
              : (code: UccCode) => {
                  code.write(fragment);
                },
          ),
        );
      }
    }

    return this;
  }

  indent(...fragments: (UccCode.Source | UccCode.Fragment)[]): this {
    this.#parts.push(new UccCode(this).write(...fragments));

    return this;
  }

  toCode(): UccCode.Builder {
    return code => code.write(...this.#parts.map(part => part.toCode()));
  }

  async print(): Promise<string> {
    const fragments = await Promise.all(this.#parts.map(async fragment => await fragment.print()));

    return fragments.join('');
  }

}

interface UccCode$Part extends UccCode.Fragment {
  print(): string | Promise<string>;
}

class UccCode$Line implements UccCode$Part {

  readonly #line: string;

  constructor(line: string) {
    this.#line = line;
  }

  toCode(): string {
    return this.#line;
  }

  print(): string {
    return `${this.#line}\n`;
  }

}

class UccCode$Fragment implements UccCode$Part {

  readonly #parent: UccCode;
  readonly #toCode: UccCode.Builder;

  constructor(parent: UccCode, toCode: UccCode.Builder) {
    this.#parent = parent;
    this.#toCode = toCode;
  }

  toCode(): UccCode.Builder {
    return this.#toCode;
  }

  async print(): Promise<string> {
    return await new UccCode(this.#parent).write(this.toCode()).print();
  }

}

export namespace UccCode {
  export type Source<TCode extends UccCode = UccCode> = string | Builder<TCode>;

  export interface Fragment<out TCode extends UccCode = UccCode> {
    toCode(): string | Source<TCode>;
  }

  export type Builder<in TCode extends UccCode = UccCode> = {
    buildCode(code: TCode): unknown;
  }['buildCode'];
}
