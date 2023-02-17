export class UccNamespace {

  readonly #names = new Map<string, string[]>();

  name(preferred = 'tmp'): string {
    let name: string;
    const names = this.#names.get(preferred);

    if (!names) {
      name = preferred;
    } else {
      name = this.#nextName(names);
      names.push(name);
    }

    this.#names.set(name, [name]);

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

    return conflict ? this.#nextName(conflict) : name;
  }

}
