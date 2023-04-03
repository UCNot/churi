import { safeJsId } from '../impl/safe-js-id.js';
import { UccCode, UccFragment, UccSource } from './ucc-code.js';
import { UccNamespace } from './ucc-namespace.js';
import { UccPrinter } from './ucc-printer.js';

export class UccDeclarations implements UccFragment {

  readonly #ns: UccNamespace;
  readonly #stack = new UccDeclStack();
  readonly #byKey = new Map<string, UccDeclSnippet>();
  readonly #all: UccDeclSnippet[] = [];

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

  #declare(
    id: string,
    snippet: (name: string) => UccSource,
    { key = id }: { readonly key?: string | null | undefined } = {},
  ): string {
    let snippetKey: string | undefined;

    if (key != null) {
      snippetKey = key === id ? `id:${id}` : `key:${key}`;

      const knownSnippet = this.#byKey.get(snippetKey);

      if (knownSnippet) {
        this.#stack.addDep(knownSnippet);

        return knownSnippet.name;
      }
    }

    const name = this.#ns.name(id);
    const newSnippet = new UccDeclSnippet(name, snippet);

    if (snippetKey) {
      this.#byKey.set(snippetKey, newSnippet);
    }
    this.#all.push(newSnippet);
    this.#stack.addDep(newSnippet);

    return name;
  }

  toCode(): UccSource {
    return {
      prePrint: () => {
        const records = this.#prePrintAll();

        return {
          printTo: lines => this.#printAll(lines, records),
        };
      },
    };
  }

  #prePrintAll(): Map<UccDeclSnippet, string | UccPrinter.Record> {
    const records = new Map<UccDeclSnippet, string | UccPrinter.Record>();

    for (const snippet of this.#all) {
      this.#prePrintSnippet(snippet, records);
    }

    return records;
  }

  #prePrintSnippet(
    snippet: UccDeclSnippet,
    records: Map<UccDeclSnippet, string | UccPrinter.Record>,
  ): void {
    if (!records.has(snippet)) {
      const prev = this.#stack.start(snippet);

      try {
        records.set(snippet, '/* Printing... */'); // Prevent recurrent duplicates.
        records.set(snippet, snippet.prePrint());
      } finally {
        this.#stack.end(prev);
      }
    }
  }

  #printAll(
    lines: UccPrinter.Lines,
    records: Map<UccDeclSnippet, string | UccPrinter.Record>,
  ): void {
    const printed = new Set<UccDeclSnippet>();

    for (const [snippet, record] of records) {
      this.#printSnippet(snippet, record, records, printed, lines);
    }
  }

  #printSnippet(
    snippet: UccDeclSnippet,
    record: string | UccPrinter.Record,
    records: Map<UccDeclSnippet, string | UccPrinter.Record>,
    printed: Set<UccDeclSnippet>,
    lines: UccPrinter.Lines,
  ): void {
    if (!printed.has(snippet)) {
      // Prevent infinite recursion.
      printed.add(snippet);

      // First, print all snipped dependencies.
      for (const dep of snippet.deps) {
        this.#printSnippet(dep, records.get(dep)!, records, printed, lines);
      }

      // Then, print the snippet itself.
      lines.print(record);
    }
  }

}

class UccDeclStack {

  #top: UccDeclSnippet | null = null;

  start(snippet: UccDeclSnippet): UccDeclSnippet | null {
    const top = this.#top;

    this.#top = snippet;

    return top;
  }

  addDep(dependency: UccDeclSnippet): void {
    this.#top?.deps.add(dependency);
  }

  end(top: UccDeclSnippet | null): void {
    this.#top = top;
  }

}

class UccDeclSnippet {

  readonly #name: string;
  readonly #snippet: (name: string) => UccSource;
  readonly deps = new Set<UccDeclSnippet>();

  constructor(name: string, snippet: (name: string) => UccSource) {
    this.#name = name;
    this.#snippet = snippet;
  }

  get name(): string {
    return this.#name;
  }

  prePrint(): string | UccPrinter.Record {
    return new UccCode().write(this.#snippet(this.#name)).prePrint();
  }

}
