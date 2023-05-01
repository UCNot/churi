import { asArray, lazyValue } from '@proc7ts/primitives';
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
    return this.#declare(
      id,
      typeof initializer === 'string'
        ? ({ name }) => `const ${name} = ${initializer};`
        : location => initializer({
              ...location,
              init(value) {
                return code => {
                  code.inline('const ', location.name, ' = ', value, ';');
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
      exported,
      key = null,
      baseClass,
      refs = [],
    }: {
      readonly exported?: boolean | undefined;
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
      { exported, key, refs: [...asArray(baseClass), ...refs] },
    );
  }

  #declare(
    id: string,
    snippet: (location: UccDeclLocation) => UccSource,
    {
      exported,
      key = id,
      refs,
    }: {
      readonly exported?: boolean | undefined;
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
    const newSnippet = new UccDeclSnippet(name, snippet, exported ? id : undefined);

    newSnippet.referAll(refs);
    this.#addDecl(snippetKey, newSnippet);

    return name;
  }

  compile(format: UccLib.Format = 'mjs'): UccDeclarations.Compiled {
    const emit = lazyValue(async () => await this.#emit(format));

    return {
      body: {
        emit: async () => {
          const { body } = await emit();

          return body;
        },
      },
      exports: {
        emit: async () => {
          const { exports = '' } = await emit();

          return exports;
        },
      },
    };
  }

  async #emit(format: UccLib.Format): Promise<UccEmittedDecl> {
    const promises = this.#emitAll(format);
    const resolutions = [...promises].map(
      async ([snippet, record]) => [snippet, await record] as const,
    );
    let whenAllEmitted: Promise<unknown> = Promise.resolve();
    const records = new Map<UccDeclSnippet, UccEmittedDecl>();

    this.#addDecl = (key, snippet) => {
      this.#doAddDecl(key, snippet);

      const whenEmitted = this.#emitSnippet(format, snippet, promises);

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

    const bodySpan = new UccPrinter();
    const exportsSpan = new UccPrinter();

    let print = async (): Promise<void> => {
      this.#addDecl = () => {
        throw new TypeError('Declarations already printed');
      };
      print = () => Promise.resolve();

      await whenAllEmitted;

      this.#printAll(bodySpan, exportsSpan, records);
    };

    return {
      body: {
        printTo: async span => {
          await print();
          span.print(bodySpan);
        },
      },
      exports: {
        printTo: async span => {
          await print();

          if (format === 'factory') {
            span
              .print('return {')
              .indent(span => span.print(exportsSpan))
              .print('};');
          } else {
            span.print(`export {`).indent(span => span.print(exportsSpan).print('}'));
          }
        },
      },
    };
  }

  #emitAll(format: UccLib.Format): Map<UccDeclSnippet, Promise<UccEmittedDecl>> {
    const promises = new Map<UccDeclSnippet, Promise<UccEmittedDecl>>();

    for (const snippet of this.#all) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.#emitSnippet(format, snippet, promises);
    }

    return promises;
  }

  #emitSnippet(
    format: UccLib.Format,
    snippet: UccDeclSnippet,
    promises: Map<UccDeclSnippet, Promise<UccEmittedDecl>>,
  ): Promise<UccEmittedDecl> {
    promises.set(snippet, Promise.resolve({ body: '/* Emitting... */' })); // Prevent recurrent duplicates.

    const whenEmitted = snippet.emit(format);

    promises.set(snippet, whenEmitted);

    return whenEmitted;
  }

  #printAll(
    body: UccPrinter,
    exports: UccPrinter,
    records: Map<UccDeclSnippet, UccEmittedDecl>,
  ): void {
    const printed = new Set<UccDeclSnippet>();

    for (const [snippet, record] of records) {
      this.#printSnippet(snippet, record, records, printed, body, exports);
    }
  }

  #printSnippet(
    snippet: UccDeclSnippet,
    record: UccEmittedDecl,
    records: Map<UccDeclSnippet, UccEmittedDecl>,
    printed: Set<UccDeclSnippet>,
    body: UccPrinter,
    exports: UccPrinter,
  ): void {
    if (!printed.has(snippet)) {
      // Prevent infinite recursion.
      printed.add(snippet);

      // First, print all snipped dependencies.
      for (const refName of snippet.refs()) {
        const ref = this.#byName.get(refName);

        if (ref) {
          this.#printSnippet(ref, records.get(ref)!, records, printed, body, exports);
        }
      }

      // Then, print the snippet itself.
      body.print(record.body);
      if (record.exports) {
        exports.print(record.exports);
      }
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
  readonly #exportAs: string | undefined;
  readonly #refs = new Set<string>();

  constructor(name: string, snippet: (location: UccDeclLocation) => UccSource, exportAs?: string) {
    this.#name = name;
    this.#snippet = snippet;
    this.#exportAs = exportAs;
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

  async emit(format: UccLib.Format): Promise<UccEmittedDecl> {
    let exports: string | undefined;
    let prefix: string | undefined;

    if (this.#exportAs != null) {
      if (format === 'factory') {
        exports =
          this.#exportAs === this.#name ? `${this.#name},` : `${this.#exportAs}: ${this.#name},`;
      } else if (this.#exportAs === this.#name) {
        prefix = 'export ';
      } else {
        exports = `${this.#name} as ${this.#exportAs},`;
      }
    }

    const body = await new UccCode()
      .write(code => {
        const snippet = this.#snippet({ name: this.#name, refer: this.refer.bind(this) });

        if (prefix) {
          code.inline(prefix, code => {
            code.block(snippet);
          });
        } else {
          code.write(snippet);
        }
      })
      .emit();

    return {
      body,
      exports,
    };
  }

}

interface UccEmittedDecl {
  readonly body: UccPrintable | string;
  readonly exports?: UccPrintable | string | undefined;
}
