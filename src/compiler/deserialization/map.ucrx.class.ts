import {
  EsArg,
  EsCode,
  EsField,
  EsFieldHandle,
  EsMemberVisibility,
  EsMethod,
  EsSnippet,
  EsSymbol,
  EsVarKind,
  EsVarSymbol,
  esQuoteKey,
  esline,
} from 'esgen';
import { UcMap } from '../../schema/map/uc-map.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { UcrxCore } from '../rx/ucrx-core.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { MapUcrxEntry } from './map.ucrx-entry.js';

export class MapUcrxClass<
  in out TEntriesModel extends UcMap.EntriesModel = UcMap.EntriesModel,
  out TExtraModel extends UcModel | false = false,
> extends UcrxClass<
  UcrxSignature.Args,
  UcMap.Infer<TEntriesModel, TExtraModel>,
  UcMap.Schema<TEntriesModel, TExtraModel>
> {

  static uccEnable<TBoot extends UcrxBootstrap<TBoot>>(
    boot: TBoot,
  ): UccFeature.Handle<UcMap.Variant> {
    return {
      inspect({ entries, extra }: UcMap.Schema) {
        for (const entrySchema of Object.values(entries)) {
          boot.processModel(entrySchema);
        }
        if (extra) {
          boot.processModel(extra);
        }
      },
      constrain: ({ schema, options }: UccFeature.Constraint<UcMap.Variant, UcMap.Schema>) => {
        boot.useUcrxClass(schema, (lib, schema: UcMap.Schema) => new this(lib, schema, options));
      },
    };
  }

  readonly #entries: EsSymbol | undefined;
  readonly #extra: EsSymbol | undefined;
  readonly #collector: MapUcrxClass$Collector;
  readonly #store: MapUcrxStore;
  readonly #slot: EsFieldHandle;

  constructor(
    lib: UcrxLib,
    schema: UcMap.Schema<TEntriesModel, TExtraModel>,
    variant?: UcMap.Variant,
  ) {
    super({
      lib,
      typeName: MapUcrxClass$typeName(lib, schema),
      schema,
      baseClass: lib.baseUcrx,
      classConstructor: {
        args: UcrxSignature,
      },
    });

    this.#entries = this.#declareEntries();
    this.#extra = this.#declareExtra();
    this.#collector = this.#declareCollector(variant);
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
    return !!this.#collector?.counter;
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

  #declareCollector({ duplicates = 'overwrite' }: UcMap.Variant = {}): MapUcrxClass$Collector {
    const counter = this.#declareCounter();

    switch (duplicates) {
      case 'overwrite':
        return counter ? { assigned: this.#declareAssigned(), counter, noDuplicates: false } : {};
      case 'reject':
        return { assigned: this.#declareAssigned(), counter, noDuplicates: true };
      case 'collect':
        return { rxs: this.#declareAssigned('rxs'), counter };
    }
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

    return {
      requiredCount,
      missingCount,
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

  #declareAssigned(name: 'assigned' | 'rxs' = 'assigned'): EsFieldHandle {
    return new EsField(name, {
      visibility: EsMemberVisibility.Private,
    }).declareIn(this, {
      initializer: () => '{}',
    });
  }

  #declareFor(): void {
    UcrxCore.for.overrideIn(this, {
      body:
        ({ member: { args } }) => code => {
          const { key, cx } = args;
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

          const { assigned, rxs, counter, noDuplicates } = this.#collector;

          if (assigned) {
            const assignedByKey = esline`${assigned.get('this')}[${key}]`;
            const rx = new EsVarSymbol('rx');

            code.write(
              rx.declare({
                value: () => this.#createEntryRx(args, entry),
              }),
            );

            if (noDuplicates) {
              code
                .write(esline`if (${assignedByKey}) {`)
                .indent(code => {
                  const ucrxRejectDuplicateEntry = UC_MODULE_CHURI.import(
                    'ucrxRejectDuplicateEntry',
                  );

                  code.write(
                    esline`${cx}.reject(${ucrxRejectDuplicateEntry}(${key}));`,
                    `return cx.opaqueRx;`,
                  );
                })
                .write('}')
                .write(esline`if (${entry}.use) {`);
            } else {
              code.write(esline`if (${entry}.use && !${assignedByKey}) {`);
            }

            code
              .indent(code => {
                if (counter) {
                  const { missingCount } = counter;

                  code.write(esline`--${missingCount.get('this')};`);
                }
                code.write(esline`${assignedByKey} = 1;`);
              })
              .write('}')
              .write(esline`return ${rx};`);
          } else if (rxs) {
            const rxByKey = esline`${rxs.get('this')}[${key}]`;

            const rx = new EsVarSymbol('rx');

            code
              .write(
                rx.declare({
                  as: EsVarKind.Let,
                  value: () => esline`${rxs.get('this')}[${key}]`,
                }),
              )
              .write(esline`if (${rx}) {`)
              .indent(code => {
                code
                  .write(esline`if (!${rx}.and()) {`)
                  .indent(`return ${cx}.opaqueRx;`)
                  .write('}');
              })
              .write(esline`} else {`)
              .indent(code => {
                code.write(esline`${rx} = ${rxByKey} = ${this.#createEntryRx(args, entry)};`);

                if (counter) {
                  const { missingCount } = counter;

                  code
                    .write(esline`if (${entry}.use) {`)
                    .indent(esline`--${missingCount.get('this')};`)
                    .write('}');
                }
              })
              .write('}')
              .write(esline`return ${rx};`);
          } else {
            code.line('return ', this.#createEntryRx(args, entry), ';');
          }
        },
    });
  }

  #createEntryRx({ key }: { key: EsSnippet }, entry: EsSnippet): EsSnippet {
    return esline`${entry}.rx(${this.#slot.get('this')}, ${key})`;
  }

  #rejectEntry({ key, cx }: { key: EsSnippet; cx: EsSnippet }): EsSnippet {
    const ucrxRejectEntry = UC_MODULE_CHURI.import('ucrxRejectEntry');

    return code => {
      code.write(esline`${cx}.reject(${ucrxRejectEntry}(${key}));`, 'return;');
    };
  }

  #declareMap(): void {
    const map = esline`${this.#slot.get('this')}[0]`;
    const store = this.#store;
    const { rxs, assigned = rxs, counter } = this.#collector;

    if (assigned) {
      const ucrxRejectMissingEntries = UC_MODULE_CHURI.import('ucrxRejectMissingEntries');

      UcrxCore.map.overrideIn(this, {
        body:
          ({
            member: {
              args: { cx },
            },
          }) => code => {
            if (rxs) {
              // Explicitly finish the charges.
              code.write(esline`Object.values(${rxs.get('this')}).forEach(rx => rx._end());`);
            }

            if (counter) {
              // Check the required entities assigned.
              const { requiredCount, missingCount } = counter;

              code
                .write(esline`if (${missingCount.get('this')}) {`)
                .indent(
                  esline`${cx}.reject(${ucrxRejectMissingEntries}(${assigned.get('this')}, ${
                    this.#entries! // Won't be accessed without entries
                  }));`,
                  'return 0;',
                )
                .write(`} else {`)
                .indent(esline`this.set(${store.store(map, cx)});`)
                .write(`}`)
                .line(missingCount.set('this', `${requiredCount}`), ';');
            } else {
              code.line('this.set(', store.store(map, cx), ');');
            }

            // Reclaim the map.
            code
              .line(esline`${map} = ${store.reclaim(map)};`)
              .line(assigned.set('this', '{}'), ';')
              .write(`return 1;`);
          },
      });
    } else {
      UcrxCore.map.overrideIn(this, {
        body:
          ({
            member: {
              args: { cx },
            },
          }) => code => {
            code
              .line('this.set(', store.store(map, cx), ');')
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
            args: { set },
          },
        }) => code => {
          code
            .line('super', this.baseClass!.classConstructor.signature.call({ set }), ';')
            .line(this.#slot.set('this', esline`[${this.#store.init()}]`), ';');
        },
    });
  }

  entryUcrxFor(key: string | null, schema: UcSchema): UcrxClass {
    const entryClass = MapUcrxEntry.ucrxClass(this.lib, this.schema, key, schema);

    return this.#collector.rxs ? entryClass.associate(MultiEntryUcrxClass$associate) : entryClass;
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
  store(map: EsSnippet, cx: EsSnippet): EsSnippet;
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
  readonly missingCount: EsFieldHandle;
}

type MapUcrxClass$Collector =
  | MapUcrxClass$NoCollector
  | MapUcrxClass$RxCollector
  | MapUcrxClass$AssignedCollector;

interface MapUcrxClass$NoCollector {
  readonly assigned?: undefined;
  readonly rxs?: undefined;
  readonly counter?: undefined;
  readonly noDuplicates?: undefined;
}

interface MapUcrxClass$RxCollector {
  readonly assigned?: undefined;
  readonly rxs: EsFieldHandle;
  readonly counter?: MapUcrxStore$Counter | undefined;
  readonly noDuplicates?: undefined;
}

interface MapUcrxClass$AssignedCollector {
  readonly assigned: EsFieldHandle;
  readonly rxs?: undefined;
  readonly counter?: MapUcrxStore$Counter | undefined;
  readonly noDuplicates: boolean;
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

class MultiEntryUcrxClass<
  out TArgs extends UcrxSignature.Args = UcrxSignature.Args,
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> extends UcrxClass<TArgs, T, TSchema> {

  static readonly _end = new EsMethod<{ cx: EsArg }>('_end', {
    args: UcrxCore.end.signature,
  });

  constructor(baseClass: UcrxClass<TArgs, T, TSchema>) {
    super({
      lib: baseClass.lib,
      schema: baseClass.schema,
      baseClass,
      typeName: `${baseClass.typeName}$Entry`,
    });

    // Do not finish the charge on calling `.end()`.
    // Finish it explicitly instead by calling `._end()`.
    UcrxCore.end.overrideIn(this, {
      body: () => EsCode.none,
    });
    MultiEntryUcrxClass._end.declareIn(this as UcrxClass.Any, {
      body: ({
        member: {
          args: { cx },
        },
      }) => esline`super.end(${cx});`,
    });
  }

}

function MultiEntryUcrxClass$associate<
  TArgs extends UcrxSignature.Args = UcrxSignature.Args,
  T = unknown,
  TSchema extends UcSchema<T> = UcSchema<T>,
>(target: UcrxClass<TArgs, T, TSchema>): MultiEntryUcrxClass<TArgs, T, TSchema> {
  return new MultiEntryUcrxClass(target);
}
