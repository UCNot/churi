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
    { key = id }: { readonly key?: string | undefined } = {},
  ): string {
    const snippetKey = key === id ? `id:${id}` : `key:${key}`;
    let name = this.#snippets.get(snippetKey);

    if (name) {
      return name;
    }

    name = this.#ns.name(id);

    if (typeof initializer === 'string') {
      this.#code.write(`const ${name} = ${initializer};`);
    } else {
      this.#code.write(initializer(`const ${name} = `, `;`));
    }

    this.#snippets.set(snippetKey, id);

    return name;
  }

  declareConst(
    key: string,
    initializer: string,
    {
      prefix = 'CONST_',
    }: { readonly prefix?: string | undefined; readonly key?: string | undefined } = {},
  ): string {
    const id =
      prefix
      + key.replace(UCC_NON_ID_REPLACEMENT_PATTERN, c => '_x' + c.charCodeAt(0).toString(16) + '_');

    return this.declare(id, initializer, { key: initializer });
  }

  toCode(): UccCode.Source {
    return code => code.write(this.#code);
  }

}

const UCC_NON_ID_REPLACEMENT_PATTERN = /(?:^[^a-zA-Z_$]|(?<!^)[^0-9a-zA-Z_$])/g;
