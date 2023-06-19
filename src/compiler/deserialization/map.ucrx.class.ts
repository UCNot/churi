import {
  EsField,
  EsFieldHandle,
  EsMemberVisibility,
  EsSnippet,
  EsSymbol,
  EsVarSymbol,
  esQuoteKey,
  esline,
} from 'esgen';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { MapUcrxEntry } from './map.ucrx-entry.js';
import { UcdCompiler } from './ucd-compiler.js';

export class MapUcrxClass<
  in out TEntriesModel extends UcMap.EntriesModel = UcMap.EntriesModel,
  out TExtraModel extends UcModel | false = false,
> extends UcrxClass<
  UcrxSignature.Args,
  UcMap.Infer<TEntriesModel, TExtraModel>,
  UcMap.Schema<TEntriesModel, TExtraModel>
> {

  static uccProcessSchema(compiler: UcdCompiler.Any, { entries, extra }: UcMap.Schema): UccConfig {
    return {
      configure: () => {
        compiler.useUcrxClass('map', (lib, schema: UcMap.Schema) => new this(lib, schema));
        for (const entrySchema of Object.values(entries)) {
          compiler.processModel(entrySchema);
        }
        if (extra) {
          compiler.processModel(extra);
        }
      },
    };
  }

  readonly #lib: UcrxLib;
  readonly #entries: EsSymbol | undefined;
  readonly #extra: EsSymbol | undefined;
  readonly #context: EsFieldHandle;
  readonly #counter: MapUcrxStore$Counter | undefined;
  readonly #store: MapUcrxStore;
  readonly #slot: EsFieldHandle;

  constructor(lib: UcrxLib, schema: UcMap.Schema<TEntriesModel, TExtraModel>) {
    super({
      typeName: MapUcrxClass$typeName(lib, schema),
      schema,
      baseClass: lib.baseUcrx,
      classConstructor: {
        args: UcrxSignature,
      },
    });

    this.#lib = lib;

    this.#entries = this.#declareEntries();
    this.#extra = this.#declareExtra();
    this.#context = new EsField('context', { visibility: EsMemberVisibility.Private }).declareIn(
      this,
    );
    this.#counter = this.#declareCounter();
    this.#store = this.allocateStore();
    this.#slot = new EsField('slot', { visibility: EsMemberVisibility.Private }).declareIn(this);

    this.#declareConstructor();
    this.#declareFor();
    this.#declareMap();
    if (schema.nullable) {
      this.#declareNul();
    }
  }

  get hasRequired(): boolean {
    return !!this.#counter;
  }

  #declareEntries(): EsSymbol | undefined {
    const entries = Object.entries<UcSchema>(this.schema.entries);

    if (!entries.length) {
      return;
    }

    return new EsVarSymbol(`${this.symbol.requestedName}$entries`, {
      declare: {
        at: 'bundle',
        value: () => code => {
          code.multiLine(code => {
            code
              .write(`{`)
              .indent(code => {
                for (const [key, entrySchema] of entries) {
                  const entry = this.createEntry(key, entrySchema);

                  code.line(esQuoteKey(key), ': ', entry.declare(this.#store), ',');
                }
              })
              .write(`}`);
          });
        },
      },
    });
  }

  #declareExtra(): EsSymbol | undefined {
    const { extra } = this.schema;

    if (!extra) {
      return;
    }

    return new EsVarSymbol(`${this.symbol.requestedName}$extra`, {
      declare: {
        at: 'bundle',
        value: () => this.createEntry(null, extra).declare(this.#store),
      },
    });
  }

  #declareCounter(): MapUcrxStore$Counter | undefined {
    const requiredCount = this.#countRequired();

    if (!requiredCount) {
      return;
    }

    const missingCount = new EsField('missingCount', {
      visibility: EsMemberVisibility.Private,
    }).declareIn(this, {
      initializer: () => `${requiredCount}`,
    });
    const assigned = new EsField('assigned', { visibility: EsMemberVisibility.Private }).declareIn(
      this,
      {
        initializer: () => '{}',
      },
    );

    return {
      requiredCount,
      missingCount,
      assigned,
    };
  }

  #countRequired(): number {
    let requiredCount = 0;

    for (const { optional } of Object.values(this.schema.entries)) {
      if (!optional) {
        ++requiredCount;
      }
    }

    return requiredCount;
  }

  #declareFor(): void {
    UcrxCore.for.overrideIn(this, {
      body:
        ({ member: { args } }) => code => {
          const { key } = args;
          const entries = this.#entries;
          const extra = this.#extra;

          if (!entries) {
            if (extra) {
              // Only extra present.
              // No need for complex logic.
              code.line('return ', this.#createEntryRx(args, extra), ';');
            } else {
              // Neither entries, nor extra present.
              // Empty map expected.
              code.write(this.#rejectEntry(args));
            }

            return;
          }

          const entry = new EsVarSymbol('entry');

          code.write(
            entry.declare({
              value: () => code => {
                code.write(esline`${entries}[${key}]`);
                if (extra) {
                  code.write(' || ', extra);
                }
              },
            }),
          );

          if (!extra) {
            // Not needed when extra present.
            code
              .write(esline`if (!${entry}) {`)
              .indent(this.#rejectEntry(args))
              .write('}');
          }

          const counter = this.#counter;

          if (counter) {
            const { missingCount, assigned } = counter;
            const rx = new EsVarSymbol('rx');

            code
              .write(
                rx.declare({
                  value: () => this.#createEntryRx(args, entry),
                }),
              )
              .write(esline`if (${entry}.use && !${assigned.get('this')}[${key}]) {`)
              .indent(
                esline`--${missingCount.get('this')};`,
                esline`${assigned.get('this')}[${key}] = 1;`,
              )
              .write('}')
              .write(esline`return ${rx};`);
          } else {
            code.line('return ', this.#createEntryRx(args, entry), ';');
          }
        },
    });
  }

  #createEntryRx({ key }: { key: EsSnippet }, entry: EsSnippet): EsSnippet {
    return esline`${entry}.rx(${this.#context.get('this')}, ${this.#slot.get('this')}, ${key})`;
  }

  #rejectEntry({ key, reject }: { key: EsSnippet; reject: EsSnippet }): EsSnippet {
    const ucrxRejectEntry = UC_MODULE_CHURI.import('ucrxRejectEntry');

    return code => {
      code.write(esline`${reject}(${ucrxRejectEntry}(${key}));`, 'return;');
    };
  }

  #declareMap(): void {
    const map = esline`${this.#slot.get('this')}[0]`;
    const store = this.#store;
    const counter = this.#counter;

    if (counter) {
      const { requiredCount, missingCount, assigned } = counter;
      const ucrxRejectMissingEntries = UC_MODULE_CHURI.import('ucrxRejectMissingEntries');

      UcrxCore.map.overrideIn(this, {
        body:
          ({
            member: {
              args: { reject },
            },
          }) => code => {
            code
              .write(esline`if (${missingCount.get('this')}) {`)
              .indent(
                esline`${reject}(${ucrxRejectMissingEntries}(${assigned.get('this')}, ${
                  this.#entries! // Won't be accessed without entries
                }));`,
                'return 0;',
              )
              .write(`} else {`)
              .indent(esline`this.set(${store.store(map)});`)
              .write(`}`)
              .line(missingCount.set('this', `${requiredCount}`), ';')
              .line(esline`${map} = ${store.reclaim(map)};`)
              .line(assigned.set('this', '{}'), ';')
              .write(`return 1;`);
          },
      });
    } else {
      UcrxCore.map.overrideIn(this, {
        body: () => code => {
          code
            .line('this.set(', this.#store.store(map), ');')
            .line(esline`${map} = ${store.reclaim(map)};`)
            .write('return 1;');
        },
      });
    }
  }

  #declareNul(): void {
    UcrxCore.nul.overrideIn(this, {
      body: () => `return this.set(null);`,
    });
  }

  #declareConstructor(): void {
    this.declareConstructor({
      body:
        ({
          member: {
            args: { set, context },
          },
        }) => code => {
          code
            .line('super', this.baseClass!.classConstructor.signature.call({ set, context }), ';')
            .line(this.#context.set('this', context), ';')
            .line(this.#slot.set('this', esline`[${this.#store.init()}]`), ';');
        },
    });
  }

  entryUcrxFor(key: string | null, schema: UcSchema): UcrxClass {
    return MapUcrxEntry.ucrxClass(this.#lib, this.schema, key, schema);
  }

  createEntry(key: string | null, schema: UcSchema): MapUcrxEntry {
    return new MapUcrxEntry(this as unknown as MapUcrxClass, key, schema);
  }

  allocateStore(): MapUcrxStore {
    return new MapUcrxStore$Default();
  }

}

export interface MapUcrxStore {
  init(): EsSnippet;
  setEntry(map: EsSnippet, key: EsSnippet, value: EsSnippet): EsSnippet;
  store(map: EsSnippet): EsSnippet;
  reclaim(map: EsSnippet): EsSnippet;
}

class MapUcrxStore$Default implements MapUcrxStore {

  init(): EsSnippet {
    return '{}';
  }

  setEntry(map: EsSnippet, key: EsSnippet, value: EsSnippet): EsSnippet {
    return esline`${map}[${key}] = ${value};`;
  }

  store(map: EsSnippet): EsSnippet {
    return map;
  }

  reclaim(_map: EsSnippet): EsSnippet {
    return this.init();
  }

}

interface MapUcrxStore$Counter {
  readonly requiredCount: number;
  readonly assigned: EsFieldHandle;
  readonly missingCount: EsFieldHandle;
}

export namespace MapUcrxClass {
  export interface Decls {
    readonly entries: string;
    readonly extra: string | undefined;
    readonly requiredCount: number;
  }

  export type Allocation = Allocation.WithRequiredEntries | Allocation.WithOptionalEntries;
  export namespace Allocation {
    export interface WithRequiredEntries {
      readonly decls: Decls;
      readonly context: string;
      readonly map: string;
      readonly assigned: string;
      readonly missingCount: string;
    }
    export interface WithOptionalEntries {
      readonly decls: Decls;
      readonly context: string;
      readonly map: string;
      readonly assigned?: undefined;
      readonly missingCount?: undefined;
    }
  }
}

function MapUcrxClass$typeName<
  TEntriesModel extends UcMap.EntriesModel,
  TExtraModel extends UcModel | false,
>(lib: UcrxLib, schema: UcMap.Schema<TEntriesModel, TExtraModel>): string {
  const { entries, extra } = schema;
  const entryTypeNames = new Set<string>();

  const addEntry = (entryKey: string | null, entrySchema: UcSchema): void => {
    const { typeName } = MapUcrxEntry.ucrxClass(lib, schema, entryKey, entrySchema);

    entryTypeNames.add(typeName);
  };

  Object.entries<UcSchema>(entries).forEach(([key, schema]) => addEntry(key, schema));
  if (extra) {
    addEntry(null, extra);
  }

  return `Map${ucSchemaVariant(schema)}Of` + [...entryTypeNames].join('Or');
}
