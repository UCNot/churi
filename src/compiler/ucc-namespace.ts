export class UccNamespace {

  readonly #enclosing: UccNamespace | undefined;

  constructor(enclosing?: UccNamespace) {
    this.#enclosing = enclosing;
  }

  readonly #names = new Map<string, UccNames>();

  name(preferred = 'tmp', forNested = false): string {
    if (forNested) {
      const names = this.#names.get(preferred);

      if (names?.nested) {
        return names.nested;
      }
    }

    if (this.#enclosing) {
      const names = this.#names.get(preferred);
      const name = this.#reserveName(
        this.#enclosing.name(names ? this.#nextName(names) : preferred, true),
        forNested,
      );

      if (names && name !== preferred) {
        this.#addAlias(names, name, forNested);
      }

      return name;
    }

    return this.#reserveName(preferred, forNested);
  }

  #reserveName(preferred: string, forNested: boolean): string {
    const names = this.#names.get(preferred);
    let name: string;

    if (names) {
      name = this.#nextName(names);
      this.#addAlias(names, name, forNested);
    } else {
      name = preferred;
    }

    this.#names.set(name, { list: [name], nested: forNested ? name : undefined });

    return name;
  }

  #addAlias(names: UccNames, alias: string, forNested: boolean): void {
    names.list.push(alias);
    if (forNested && !names.nested) {
      names.nested = alias;
    }
  }

  #nextName({ list }: UccNames): string {
    const lastName = list[list.length - 1];
    const dollarIdx = lastName.lastIndexOf('$');
    const lastIndex = dollarIdx < 0 ? NaN : Number(lastName.slice(dollarIdx + 1));
    let name: string;

    if (Number.isFinite(lastIndex)) {
      name = `${lastName.slice(0, dollarIdx)}$${lastIndex + 1}`;
    } else {
      name = `${lastName}$0`;
    }

    const conflict = this.#names.get(name);

    return conflict ? this.#nextName(conflict) : name;
  }

  nest(): UccNamespace {
    return new UccNamespace(this);
  }

}

interface UccNames {
  readonly list: string[];
  nested: string | undefined;
}
