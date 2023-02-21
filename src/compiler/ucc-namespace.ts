export class UccNamespace {

  readonly #enclosing: UccNamespace | undefined;

  constructor(enclosing?: UccNamespace) {
    this.#enclosing = enclosing;
  }

  readonly #names = new Map<string, UccNames>();

  name(preferred = 'tmp', forNested = false): string {
    let name: string;
    const names = this.#names.get(preferred);

    if (!names) {
      if (this.#enclosing) {
        name = this.#enclosing.name(preferred, true);
      } else {
        name = preferred;
      }
    } else {
      if (forNested && names.nested) {
        return names.nested;
      }

      const { list } = names;

      if (this.#enclosing) {
        name = this.#enclosing.name(this.#nextName(list), true);
      } else {
        name = this.#nextName(list);
      }

      list.push(name);
      if (forNested) {
        names.nested = name;
      }
    }

    this.#names.set(name, { list: [name], nested: forNested ? name : undefined });

    return name;
  }

  #nextName(names: string[]): string {
    const lastName = names[names.length - 1];
    const dollarIdx = lastName.lastIndexOf('$');
    const lastIndex = dollarIdx < 0 ? NaN : Number(lastName.slice(dollarIdx + 1));
    let name: string;

    if (Number.isFinite(lastIndex)) {
      name = `${lastName.slice(0, dollarIdx)}$${lastIndex + 1}`;
    } else {
      name = `${lastName}$0`;
    }

    const conflict = this.#names.get(name);

    return conflict ? this.#nextName(conflict.list) : name;
  }

  nest(): UccNamespace {
    return new UccNamespace(this);
  }

}

interface UccNames {
  readonly list: string[];
  nested: string | undefined;
}
