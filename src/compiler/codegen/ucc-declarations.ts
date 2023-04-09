import { safeJsId } from '../impl/safe-js-id.js';
import { UccCode, UccFragment, UccSource } from './ucc-code.js';
import { UccNamespace } from './ucc-namespace.js';
import { UccPrintSpan, UccPrintable } from './ucc-printer.js';

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
      emit: () => {
        const records = this.#emitAll();

        return {
          printTo: span => this.#printAll(span, records),
        };
      },
    };
  }

  #emitAll(): Map<UccDeclSnippet, string | UccPrintable> {
    const records = new Map<UccDeclSnippet, string | UccPrintable>();

    for (const snippet of this.#all) {
      this.#emitSnippet(snippet, records);
    }

    return records;
  }

  #emitSnippet(snippet: UccDeclSnippet, records: Map<UccDeclSnippet, string | UccPrintable>): void {
    if (!records.has(snippet)) {
      const prev = this.#stack.start(snippet);

      try {
        records.set(snippet, '/* Printing... */'); // Prevent recurrent duplicates.
        records.set(snippet, snippet.emit());
      } finally {
        this.#stack.end(prev);
      }
    }
  }

  #printAll(span: UccPrintSpan, records: Map<UccDeclSnippet, string | UccPrintable>): void {
    const printed = new Set<UccDeclSnippet>();

    for (const [snippet, record] of records) {
      this.#printSnippet(snippet, record, records, printed, span);
    }
  }

  #printSnippet(
    snippet: UccDeclSnippet,
    record: string | UccPrintable,
    records: Map<UccDeclSnippet, string | UccPrintable>,
    printed: Set<UccDeclSnippet>,
    span: UccPrintSpan,
  ): void {
    if (!printed.has(snippet)) {
      // Prevent infinite recursion.
      printed.add(snippet);

      // First, print all snipped dependencies.
      for (const dep of snippet.deps) {
        this.#printSnippet(dep, records.get(dep)!, records, printed, span);
      }

      // Then, print the snippet itself.
      span.print(record);
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

  emit(): string | UccPrintable {
    return new UccCode().write(this.#snippet(this.#name)).emit();
  }

}
