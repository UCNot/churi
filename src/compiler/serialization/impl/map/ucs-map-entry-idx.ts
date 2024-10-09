import { EsCode, EsSnippet, EsVarSymbol } from 'esgen';

export class UcsMapEntryIdx {
  readonly #declaration = new EsCode();
  readonly #postIncrement = new EsCode();
  readonly #increment = new EsCode();
  #symbol?: EsVarSymbol;

  requireIf(condition: boolean): this {
    return condition ? this.require() : this;
  }

  require(): this {
    if (!this.#symbol) {
      this.#symbol = new EsVarSymbol('entryIdx');
      this.#declaration.write(this.#symbol.let({ value: () => '0' }));
      this.#postIncrement.line(this.#symbol, '++');
      this.#increment.line(this.#postIncrement, ';');
    }

    return this;
  }

  increment(): EsSnippet {
    return this.#increment;
  }

  postIncrement(): EsSnippet {
    this.require();

    return this.#postIncrement;
  }

  get(): EsSnippet {
    this.require();

    return this.#symbol!;
  }

  declare(): EsSnippet {
    return this.#declaration;
  }
}
