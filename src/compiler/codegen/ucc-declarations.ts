import { safeJsId } from '../impl/safe-js-id.js';
import { UccCode } from './ucc-code.js';
import { UccNamespace } from './ucc-namespace.js';

export class UccDeclarations implements UccCode.Fragment {

  readonly #ns: UccNamespace;
  readonly #snippets = new Map<string, string>();
  readonly #code = new UccCode();

  constructor(ns: UccNamespace) {
    this.#ns = ns;
  }

  declare(
    id: string,
    initializer: string | ((prefix: string, suffix: string) => UccCode.Source),
    options?: { readonly key?: string | undefined },
  ): string {
    return this.#declare(
      id,
      typeof initializer === 'string'
        ? name => `const ${name} = ${initializer};`
        : name => initializer(`const ${name} = `, `;`),
      options,
    );
  }

  declareConst(
    key: string,
    initializer: string,
    {
      prefix = 'CONST_',
    }: { readonly prefix?: string | undefined; readonly key?: string | undefined } = {},
  ): string {
    return this.declare(prefix + safeJsId(key), initializer, { key: initializer });
  }

  declareClass(
    className: string,
    body: (name: string) => UccCode.Source,
    { baseClass }: { readonly baseClass?: string | undefined } = {},
  ): string {
    return this.#declare(className, name => code => {
      code
        .write(`class ${name} ` + (baseClass ? `extends ${baseClass} {` : `{`))
        .indent(body(name))
        .write(`}`);
    });
  }

  toCode(): UccCode.Source {
    return code => code.write(this.#code);
  }

  #declare(
    id: string,
    snippet: (name: string) => UccCode.Source,
    { key = id }: { readonly key?: string | undefined } = {},
  ): string {
    const snippetKey = key === id ? `id:${id}` : `key:${key}`;
    let name = this.#snippets.get(snippetKey);

    if (name) {
      return name;
    }

    name = this.#ns.name(id);

    this.#code.write(snippet(name));

    this.#snippets.set(snippetKey, name);

    return name;
  }

}
