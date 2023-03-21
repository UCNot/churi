import { escapeJsString } from '../../impl/quote-property-key.js';
import { UccCode } from './ucc-code.js';
import { UccNamespace } from './ucc-namespace.js';

export class UccImports {

  readonly #imports = new Map<string, Map<string, string>>();
  readonly #ns: UccNamespace;

  constructor(ns: UccNamespace) {
    this.#ns = ns;
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

    const alias = this.#ns.name(name);

    moduleImports.set(name, alias);

    return alias;
  }

  asStatic(): UccCode.Source {
    return {
      printTo: lines => {
        for (const [from, moduleImports] of this.#imports) {
          if (moduleImports.size > 1) {
            lines
              .print(`import {`)
              .indent(lines => {
                for (const [name, alias] of moduleImports) {
                  lines.print(`${this.#staticClause(name, alias)},`);
                }
              })
              .print(`} from '${escapeJsString(from)}';`);
          } else {
            for (const [name, alias] of moduleImports) {
              lines.print(`import { ${this.#staticClause(name, alias)} } from '${from}';`);
            }
          }
        }
      },
    };
  }

  #staticClause(name: string, alias: string): string {
    return name === alias ? name : `${name} as ${alias}`;
  }

  asDynamic(): UccCode.Source {
    return {
      printTo: lines => {
        for (const [from, moduleImports] of this.#imports) {
          if (moduleImports.size > 1) {
            lines
              .print('const {')
              .indent(lines => {
                for (const [name, alias] of moduleImports) {
                  lines.print(`${this.#dynamicClause(name, alias)},`);
                }
              })
              .print(`} = await import('${escapeJsString(from)}');`);
          } else {
            for (const [name, alias] of moduleImports) {
              lines.print(
                `const { ${this.#dynamicClause(name, alias)} } = await import('${escapeJsString(
                  from,
                )}');`,
              );
            }
          }
        }
      },
    };
  }

  #dynamicClause(name: string, alias: string): string {
    return name === alias ? name : `${name}: ${alias}`;
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
