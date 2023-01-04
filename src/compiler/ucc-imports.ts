import { UccAliases } from './ucc-aliases.js';
import { UccCode } from './ucc-code.js';

export class UccImports {

  readonly #imports = new Map<string, Map<string, string>>();
  readonly #aliases: UccAliases;

  constructor(aliases: UccAliases) {
    this.#aliases = aliases;
  }

  asStatic(): UccCode.Builder {
    return code => {
      for (const [from, moduleImports] of this.#imports) {
        for (const [name, alias] of moduleImports) {
          if (name === alias) {
            code.write(`import { ${name} } from '${from}';`);
          } else {
            code.write(`import { ${name} as ${alias} } from '${from}';`);
          }
        }
      }
    };
  }

  asDynamic(): UccCode.Builder {
    return code => {
      for (const [from, moduleImports] of this.#imports) {
        for (const [name, alias] of moduleImports) {
          if (name === alias) {
            code.write(`const ${name} = await import('${from}');`);
          } else {
            code.write(`const { ${name}: ${alias} } = await import('${from}');`);
          }
        }
      }
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
