import { safeJsId } from '../impl/safe-js-id.js';
import { UccCode, UccFragment, UccSource } from './ucc-code.js';
import { UccNamespace } from './ucc-namespace.js';

export class UccDeclarations implements UccFragment {

  readonly #ns: UccNamespace;
  readonly #snippets = new Map<string, string>();
  readonly #code = new UccCode();

  constructor(ns: UccNamespace) {
    this.#ns = ns;
  }

  declare(
    id: string,
    initializer: string | ((prefix: string, suffix: string) => UccSource),
    options?: { readonly key?: string | null | undefined },
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
    body: (name: string) => UccSource,
    {
      key = null,
      baseClass,
    }: { readonly key?: string | null | undefined; readonly baseClass?: string | undefined } = {},
  ): string {
    return this.#declare(
      className,
      name => code => {
        code
          .write(`class ${name} ` + (baseClass ? `extends ${baseClass} {` : `{`))
          .indent(body(name))
          .write(`}`);
      },
      { key },
    );
  }

  toCode(): UccSource {
    return code => code.write(this.#code);
  }

  #declare(
    id: string,
    snippet: (name: string) => UccSource,
    { key = id }: { readonly key?: string | null | undefined } = {},
  ): string {
    let snippetKey: string | undefined;

    if (key != null) {
      snippetKey = key === id ? `id:${id}` : `key:${key}`;

      const knownName = this.#snippets.get(snippetKey);

      if (knownName) {
        return knownName;
      }
    }

    const name = this.#ns.name(id);

    this.#code.write(snippet(name));

    if (snippetKey) {
      this.#snippets.set(snippetKey, name);
    }

    return name;
  }

}
