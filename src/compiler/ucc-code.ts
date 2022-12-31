export class UccCode implements UccCode.Fragment {

  readonly #parts: UccCode$Part[] = [];
  readonly #indent: string;

  constructor(parent?: UccCode) {
    this.#indent = parent ? parent.#indent + '  ' : '';
  }

  write(...fragments: (string | UccCode.Fragment<this> | UccCode.Builder<this>)[]): this {
    for (const fragment of fragments) {
      if (typeof fragment === 'string') {
        this.#parts.push(new UccCode$Line(`${this.#indent}${fragments}\n`));
      } else {
        this.#parts.push(
          new UccCode$Fragment(
            this,
            typeof fragment === 'function' ? fragment : fragment.toCode.bind(fragment),
          ),
        );
      }
    }

    return this;
  }

  indent(write: (code: UccCode) => void): this {
    const code = new UccCode(this);

    this.#parts.push(code);

    write(code);

    return this;
  }

  async toCode(code: UccCode): Promise<void> {
    for (const fragment of this.#parts) {
      await fragment.toCode(code);
    }
  }

  async print(): Promise<string> {
    const lines = await Promise.all(this.#parts.map(async fragment => await fragment.print()));

    return lines.join('');
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

  toCode(code: UccCode): void {
    code.write(this.#line);
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

  async toCode(code: UccCode): Promise<void> {
    await this.#toCode(code);
  }

  async print(): Promise<string> {
    const code = new UccCode(this.#parent);

    await this.toCode(code);

    return await code.print();
  }

}

export namespace UccCode {
  export interface Fragment<in TCode extends UccCode = UccCode> {
    toCode(code: TCode): void | PromiseLike<unknown>;
  }

  export type Builder<in TCode extends UccCode = UccCode> = Fragment<TCode>['toCode'];
}
