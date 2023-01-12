import { UccAliases } from './ucc-aliases.js';
import { UccCode } from './ucc-code.js';

export class UccDeclarations implements UccCode.Fragment {

  readonly #aliases: UccAliases;
  readonly #snippets = new Map<string, string>();
  readonly #code = new UccCode();

  constructor(aliases: UccAliases) {
    this.#aliases = aliases;
  }

  declare(
    id: string,
    initializer: string,
    { key = id }: { readonly key?: string | undefined } = {},
  ): string {
    const snippetKey = key === id ? `id:${id}` : `key:${key}`;
    let alias = this.#snippets.get(snippetKey);

    if (alias) {
      return alias;
    }

    alias = this.#aliases.aliasFor(id);

    this.#code.write(`const ${alias} = ${initializer};`);
    this.#snippets.set(snippetKey, id);

    return alias;
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
