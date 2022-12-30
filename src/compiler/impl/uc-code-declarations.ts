import { UcCodeAliases } from './uc-code-aliases.js';

export class UcCodeDeclarations {

  readonly #aliases: UcCodeAliases;
  readonly #snippets = new Map<string, string>();
  #code = '';

  constructor(aliases: UcCodeAliases) {
    this.#aliases = aliases;
  }

  declare(name: string, initializer: string): string {
    let alias = this.#snippets.get(name);

    if (alias) {
      return alias;
    }

    alias = this.#aliases.alias(name);

    this.#code += `const ${alias} = ${initializer};\n`;

    return alias;
  }

  toString(): string {
    return this.#code;
  }

}
