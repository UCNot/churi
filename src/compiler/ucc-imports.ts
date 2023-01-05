import { UccAliases } from './ucc-aliases.js';
import { UccPrinter } from './ucc-printer.js';

export class UccImports {

  readonly #imports = new Map<string, Map<string, string>>();
  readonly #aliases: UccAliases;

  constructor(aliases: UccAliases) {
    this.#aliases = aliases;
  }

  asStatic(): UccPrinter.Record {
    return {
      printTo: lines => {
        for (const [from, moduleImports] of this.#imports) {
          for (const [name, alias] of moduleImports) {
            if (name === alias) {
              lines.print(`import { ${name} } from '${from}';`);
            } else {
              lines.print(`import { ${name} as ${alias} } from '${from}';`);
            }
          }
        }
      },
    };
  }

  asDynamic(): UccPrinter.Record {
    return {
      printTo: lines => {
        for (const [from, moduleImports] of this.#imports) {
          for (const [name, alias] of moduleImports) {
            if (name === alias) {
              lines.print(`const { ${name} } = await import('${from}');`);
            } else {
              lines.print(`const { ${name}: ${alias} } = await import('${from}');`);
            }
          }
        }
      },
    };
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
      this.#imports.set(from, moduleImports);
    }

    const alias = this.#aliases.aliasFor(name);

    moduleImports.set(name, alias);

    return alias;
  }

}

export namespace UccImports {
  export interface Static extends UccImports {
    isStatic(): true;
    isDynamic(): false;
  }
  export interface Static extends UccImports {
    isStatic(): false;
    isDynamic(): true;
  }
}
