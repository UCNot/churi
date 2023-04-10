import { asArray } from '@proc7ts/primitives';
import { safeJsId } from '../impl/safe-js-id.js';
import { UccCode, UccFragment, UccSource } from './ucc-code.js';
import { UccNamespace } from './ucc-namespace.js';
import { UccPrintable, UccPrinter } from './ucc-printer.js';

export class UccDeclarations implements UccFragment {

  readonly #ns: UccNamespace;
  readonly #byKey = new Map<string, UccDeclSnippet>();
  readonly #byName = new Map<string, UccDeclSnippet>();
  readonly #all: UccDeclSnippet[] = [];
  #addDecl: (key: string | undefined, snippet: UccDeclSnippet) => void;

  constructor(ns: UccNamespace) {
    this.#ns = ns;
    this.#addDecl = this.#doAddDecl;
  }

  #doAddDecl(key: string | undefined, snippet: UccDeclSnippet): void {
    if (key) {
      this.#byKey.set(key, snippet);
    }
    this.#byName.set(snippet.name, snippet);
    this.#all.push(snippet);
  }

  declare(
    id: string,
    initializer: string | ((location: UccInitLocation) => UccSource),
    options?: {
      readonly exported?: boolean | undefined;
      readonly key?: string | null | undefined;
      readonly deps?: readonly string[] | undefined;
    },
  ): string {
    const modifier = options?.exported ? 'export ' : '';

    return this.#declare(
      id,
      typeof initializer === 'string'
        ? ({ name }) => `${modifier}const ${name} = ${initializer};`
        : location => initializer({
              ...location,
              prefix: `${modifier}const ${location.name} = `,
              suffix: `;`,
            }),
      options,
    );
  }

  declareConst(
    key: string,
    initializer: string,
    {
      prefix = 'CONST_',
      deps,
    }: {
      readonly prefix?: string | undefined;
      readonly deps?: readonly string[] | undefined;
    } = {},
  ): string {
    return this.declare(prefix + safeJsId(key), initializer, { key: initializer, deps });
  }

  declareClass(
    className: string,
    body: (location: UccDeclLocation) => UccSource,
    {
      key = null,
      baseClass,
      deps = [],
    }: {
      readonly key?: string | null | undefined;
      readonly baseClass?: string | undefined;
      readonly deps?: readonly string[] | undefined;
    } = {},
  ): string {
    return this.#declare(
      className,
      location => code => {
        code
          .write(`class ${location.name} ` + (baseClass ? `extends ${baseClass} {` : `{`))
          .indent(body(location))
          .write(`}`);
      },
      { key, deps: [...asArray(baseClass), ...deps] },
    );
  }

  #declare(
    id: string,
    snippet: (location: UccDeclLocation) => UccSource,
    {
      key = id,
      deps,
    }: {
      readonly key?: string | null | undefined;
      readonly deps?: readonly string[] | undefined;
    } = {},
  ): string {
    let snippetKey: string | undefined;

    if (key != null) {
      snippetKey = key === id ? `id:${id}` : `key:${key}`;

      const knownSnippet = this.#byKey.get(snippetKey);

      if (knownSnippet) {
        knownSnippet.addDeps(deps);

        return knownSnippet.name;
      }
    }

    const name = this.#ns.name(id);
    const newSnippet = new UccDeclSnippet(name, snippet);

    newSnippet.addDeps(deps);
    this.#addDecl(snippetKey, newSnippet);

    return name;
  }

  toCode(): UccSource {
    return {
      emit: async () => await this.#emit(),
    };
  }

  async #emit(): Promise<UccPrintable> {
    const promises = this.#emitAll();
    const resolutions = [...promises].map(
      async ([snippet, record]) => [snippet, await record] as const,
    );
    let whenAllEmitted: Promise<unknown> = Promise.resolve();

    this.#addDecl = (key, snippet) => {
      this.#doAddDecl(key, snippet);

      const whenEmitted = this.#emitSnippet(snippet, promises);

      whenAllEmitted = Promise.all([
        whenAllEmitted,
        (async () => {
          records.set(snippet, await whenEmitted);
        })(),
      ]);
    };

    const records = new Map<UccDeclSnippet, string | UccPrintable>(await Promise.all(resolutions));

    return {
      printTo: async span => {
        this.#addDecl = () => {
          throw new TypeError('Declarations already printed');
        };

        await whenAllEmitted;

        this.#printAll(span, records);
      },
    };
  }

  #emitAll(): Map<UccDeclSnippet, Promise<string | UccPrintable>> {
    const promises = new Map<UccDeclSnippet, Promise<string | UccPrintable>>();

    for (const snippet of this.#all) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.#emitSnippet(snippet, promises);
    }

    return promises;
  }

  #emitSnippet(
    snippet: UccDeclSnippet,
    promises: Map<UccDeclSnippet, Promise<string | UccPrintable>>,
  ): Promise<string | UccPrintable> {
    promises.set(snippet, Promise.resolve('/* Emitting... */')); // Prevent recurrent duplicates.

    const whenEmitted = snippet.emit();

    promises.set(snippet, whenEmitted);

    return whenEmitted;
  }

  #printAll(span: UccPrinter, records: Map<UccDeclSnippet, string | UccPrintable>): void {
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
    span: UccPrinter,
  ): void {
    if (!printed.has(snippet)) {
      // Prevent infinite recursion.
      printed.add(snippet);

      // First, print all snipped dependencies.
      for (const depName of snippet.deps()) {
        const dep = this.#byName.get(depName);

        if (dep) {
          this.#printSnippet(dep, records.get(dep)!, records, printed, span);
        }
      }

      // Then, print the snippet itself.
      span.print(record);
    }
  }

}

export interface UccDeclLocation {
  readonly name: string;
  addDep(this: void, dep: string): void;
}

export interface UccInitLocation extends UccDeclLocation {
  readonly prefix: string;
  readonly suffix: string;
}

class UccDeclSnippet {

  readonly #name: string;
  readonly #snippet: (location: UccDeclLocation) => UccSource;
  readonly #deps = new Set<string>();

  constructor(name: string, snippet: (location: UccDeclLocation) => UccSource) {
    this.#name = name;
    this.#snippet = snippet;
  }

  deps(): IterableIterator<string> {
    return this.#deps.values();
  }

  addDep(dep: string): void {
    this.#deps.add(dep);
  }

  addDeps(deps: readonly string[] | undefined): void {
    if (deps) {
      deps.forEach(dep => this.#deps.add(dep));
    }
  }

  get name(): string {
    return this.#name;
  }

  async emit(): Promise<UccPrintable> {
    return await new UccCode()
      .write(this.#snippet({ name: this.#name, addDep: this.addDep.bind(this) }))
      .emit();
  }

}
