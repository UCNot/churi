import { UcCodeAliases } from './uc-code-aliases.js';

export class UcCodeImports implements Iterable<[from: string, name: string, alias: string]> {

  readonly #imports = new Map<string, Map<string, string>>();
  readonly #aliases: UcCodeAliases;

  constructor(aliases: UcCodeAliases) {
    this.#aliases = aliases;
  }

  import(from: string, name: string): string {
    let moduleImports = this.#imports.get(from);

    if (moduleImports) {
      const imported = moduleImports.get(name);

      if (imported) {
        return imported;
      }
    } else {
      moduleImports = new Map();
    }

    const alias = this.#aliases.aliasFor(name);

    moduleImports.set(name, alias);

    return alias;
  }

  *[Symbol.iterator](): IterableIterator<[from: string, name: string, alias: string]> {
    for (const [from, moduleImports] of this.#imports) {
      for (const [name, alias] of moduleImports) {
        yield [from, name, alias];
      }
    }
  }

}
