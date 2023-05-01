import { asArray } from '@proc7ts/primitives';
import { safeJsId } from '../impl/safe-js-id.js';
import { UccCode, UccSource } from './ucc-code.js';
import { UccLib } from './ucc-lib.js';
import { UccNamespace } from './ucc-namespace.js';
import { UccPrintable, UccPrinter } from './ucc-printer.js';

export class UccDeclarations {

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
      readonly refs?: readonly string[] | undefined;
    },
  ): string {
    const modifier = options?.exported ? 'export const ' : 'const ';

    return this.#declare(
      id,
      typeof initializer === 'string'
        ? ({ name }) => `${modifier}${name} = ${initializer};`
        : location => initializer({
              ...location,
              init(value) {
                return code => {
                  code.inline(modifier, location.name, ' = ', value, ';');
                };
              },
            }),
      options,
    );
  }

  declareConst(
    key: string,
    initializer: string,
    {
      prefix = 'CONST_',
      refs,
    }: {
      readonly prefix?: string | undefined;
      readonly refs?: readonly string[] | undefined;
    } = {},
  ): string {
    return this.declare(prefix + safeJsId(key), initializer, { key: initializer, refs });
  }

  declareClass(
    className: string,
    body: (location: UccDeclLocation) => UccSource,
    {
      key = null,
      baseClass,
      refs = [],
    }: {
      readonly key?: string | null | undefined;
      readonly baseClass?: string | undefined;
      readonly refs?: readonly string[] | undefined;
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
      { key, refs: [...asArray(baseClass), ...refs] },
    );
  }

  #declare(
    id: string,
    snippet: (location: UccDeclLocation) => UccSource,
    {
      key = id,
      refs,
    }: {
      readonly key?: string | null | undefined;
      readonly refs?: readonly string[] | undefined;
    } = {},
  ): string {
    let snippetKey: string | undefined;

    if (key != null) {
      snippetKey = key === id ? `id:${id}` : `key:${key}`;

      const knownSnippet = this.#byKey.get(snippetKey);

      if (knownSnippet) {
        knownSnippet.referAll(refs);

        return knownSnippet.name;
      }
    }

    const name = this.#ns.name(id);
    const newSnippet = new UccDeclSnippet(name, snippet);

    newSnippet.referAll(refs);
    this.#addDecl(snippetKey, newSnippet);

    return name;
  }

  compile(_format: UccLib.Format = 'mjs'): UccDeclarations.Compiled {
    return {
      body: {
        emit: async () => await this.#emit(),
      },
      exports: UccCode.none,
    };
  }

  async #emit(): Promise<UccPrintable> {
    const promises = this.#emitAll();
    const resolutions = [...promises].map(
      async ([snippet, record]) => [snippet, await record] as const,
    );
    let whenAllEmitted: Promise<unknown> = Promise.resolve();
    const records = new Map<UccDeclSnippet, string | UccPrintable>();

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

    for (const [snippet, record] of await Promise.all(resolutions)) {
      records.set(snippet, record);
    }

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
      for (const refName of snippet.refs()) {
        const ref = this.#byName.get(refName);

        if (ref) {
          this.#printSnippet(ref, records.get(ref)!, records, printed, span);
        }
      }

      // Then, print the snippet itself.
      span.print(record);
    }
  }

}

export namespace UccDeclarations {
  export interface Compiled {
    readonly body: UccSource;
    readonly exports: UccSource;
  }
}

export interface UccDeclLocation {
  readonly name: string;
  refer(this: void, ref: string): void;
}

export interface UccInitLocation extends UccDeclLocation {
  init(this: void, value: UccSource): UccSource;
}

class UccDeclSnippet {

  readonly #name: string;
  readonly #snippet: (location: UccDeclLocation) => UccSource;
  readonly #refs = new Set<string>();

  constructor(name: string, snippet: (location: UccDeclLocation) => UccSource) {
    this.#name = name;
    this.#snippet = snippet;
  }

  refs(): IterableIterator<string> {
    return this.#refs.values();
  }

  refer(ref: string): void {
    this.#refs.add(ref);
  }

  referAll(refs: readonly string[] | undefined): void {
    if (refs) {
      refs.forEach(ref => this.#refs.add(ref));
    }
  }

  get name(): string {
    return this.#name;
  }

  async emit(): Promise<UccPrintable> {
    return await new UccCode()
      .write(this.#snippet({ name: this.#name, refer: this.refer.bind(this) }))
      .emit();
  }

}
