import { UcCodeAliases } from './uc-code-aliases.js';
import { UcCodeBuilder } from './uc-code-builder.js';

export class UcCodeDeclarations implements Iterable<string> {

  readonly #aliases: UcCodeAliases;
  readonly #snippets = new Map<string, string>();
  readonly #code = new UcCodeBuilder();

  constructor(aliases: UcCodeAliases) {
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

  *[Symbol.iterator](): IterableIterator<string> {
    yield* this.#code;
  }

}
