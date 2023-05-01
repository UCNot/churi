import { escapeJsString } from 'httongue';
import { UccSource } from './ucc-code.js';
import { UccLib } from './ucc-lib.js';
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

  compile(format: UccLib.Format): UccSource {
    return format === 'iife' ? this.#asDynamic() : this.#asStatic();
  }

  #asStatic(): UccSource {
    return {
      printTo: span => {
        for (const [from, moduleImports] of this.#imports) {
          if (moduleImports.size > 1) {
            span
              .print(`import {`)
              .indent(span => {
                for (const [name, alias] of moduleImports) {
                  span.print(`${this.#staticClause(name, alias)},`);
                }
              })
              .print(`} from '${escapeJsString(from)}';`);
          } else {
            for (const [name, alias] of moduleImports) {
              span.print(`import { ${this.#staticClause(name, alias)} } from '${from}';`);
            }
          }
        }
      },
    };
  }

  #staticClause(name: string, alias: string): string {
    return name === alias ? name : `${name} as ${alias}`;
  }

  #asDynamic(): UccSource {
    return {
      printTo: span => {
        for (const [from, moduleImports] of this.#imports) {
          if (moduleImports.size > 1) {
            span
              .print('const {')
              .indent(span => {
                for (const [name, alias] of moduleImports) {
                  span.print(`${this.#dynamicClause(name, alias)},`);
                }
              })
              .print(`} = await import('${escapeJsString(from)}');`);
          } else {
            for (const [name, alias] of moduleImports) {
              span.print(
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
