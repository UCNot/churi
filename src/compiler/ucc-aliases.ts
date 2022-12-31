export class UccAliases {

  readonly #aliases = new Map<string, string[]>();

  aliasFor(name: string): string {
    let alias: string;
    const aliases = this.#aliases.get(name);

    if (!aliases) {
      alias = name;
      this.#aliases.set(alias, [alias]);
    } else {
      alias = this.#nextAlias(aliases);
      aliases.push(alias);
    }

    return alias;
  }

  #nextAlias(aliases: string[]): string {
    const lastAlias = aliases[aliases.length - 1];
    const dollarIdx = lastAlias.lastIndexOf('$');
    const lastIndex = dollarIdx < 0 ? NaN : Number(lastAlias.slice(dollarIdx + 1));
    let alias: string;

    if (Number.isFinite(lastIndex)) {
      alias = `${lastAlias.slice(0, dollarIdx)}$${lastIndex + 1}`;
    } else {
      alias = `${lastAlias}$0`;
    }

    const conflict = this.#aliases.get(alias);

    return conflict ? this.#nextAlias(conflict) : alias;
  }

}
