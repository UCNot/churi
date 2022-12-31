import { UccAliases } from './ucc-aliases.js';
import { UccCode } from './ucc-code.js';

export class UccDeclarations implements UccCode.Fragment {

  readonly #aliases: UccAliases;
  readonly #snippets = new Map<string, string>();
  readonly #code = new UccCode();

  constructor(aliases: UccAliases) {
    this.#aliases = aliases;
  }

  declare(name: string, initializer: string): string {
    let alias = this.#snippets.get(name);

    if (alias) {
      return alias;
    }

    alias = this.#aliases.aliasFor(name);

    this.#code.write(`const ${alias} = ${initializer};`);

    return alias;
  }

  async toCode(code: UccCode): Promise<void> {
    await this.#code.toCode(code);
  }

}
