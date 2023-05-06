import { lazyValue } from '@proc7ts/primitives';
import { escapeJsString, quoteJsKey } from 'httongue';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { ucSchemaTypeSymbol } from '../impl/uc-schema-symbol.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { CustomUcrxTemplate } from '../rx/custom.ucrx-template.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcrxArgs } from '../rx/ucrx.args.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { MapUcrxEntry } from './map.ucrx-entry.js';
import { UcdSetup } from './ucd-setup.js';

export class MapUcrxTemplate<
  TEntriesModel extends UcMap.Schema.Entries.Model = UcMap.Schema.Entries.Model,
  TExtraModel extends UcModel | false = false,
> extends CustomUcrxTemplate<
  UcMap.Infer<TEntriesModel, TExtraModel>,
  UcMap.Schema<TEntriesModel, TExtraModel>
> {

  static configureSchemaDeserializer(setup: UcdSetup.Any, { entries, extra }: UcMap.Schema): void {
    setup.useUcrxTemplate('map', (lib, schema: UcMap.Schema) => new this(lib, schema));
    for (const entrySchema of Object.values(entries)) {
      setup.processModel(entrySchema);
    }
    if (extra) {
      setup.processModel(extra);
    }
  }

  #typeName?: string;
  readonly #ns: UccNamespace;
  readonly #varEntry = lazyValue(() => this.#ns.name('entry'));
  readonly #varRx = lazyValue(() => this.#ns.name('rx'));
  #allocation?: MapUcrxTemplate.Allocation;

  constructor(lib: UcrxLib, schema: UcMap.Schema<TEntriesModel, TExtraModel>) {
    super({
      lib,
      schema,
      args: ['set', 'context'],
    });

    this.#ns = lib.ns.nest();
  }

  override get typeName(): string {
    if (!this.#typeName) {
      const { schema } = this;
      const { entries, extra } = schema;
      const entryTypeNames = new Set<string>();

      const addEntry = (entryKey: string | null, entrySchema: UcSchema): void => {
        const { typeName } = this.entryTemplate(entryKey, entrySchema);

        entryTypeNames.add(typeName);
      };

      Object.entries<UcSchema>(entries).forEach(([key, schema]) => addEntry(key, schema));
      if (extra) {
        addEntry(null, extra);
      }

      this.#typeName = `Map${ucSchemaVariant(schema)}Of` + [...entryTypeNames].join('Or');
    }

    return this.#typeName;
  }

  #getAllocation(): MapUcrxTemplate.Allocation {
    if (!this.#allocation) {
      const entries = this.#declareEntries();
      const extra = this.#declareExtra();

      const requiredCount = this.#countRequired();
      const decls: MapUcrxTemplate.Decls = {
        entries,
        extra,
        requiredCount,
      };

      const context = this.declarePrivate('context');
      const map = this.declarePrivate('map');

      if (requiredCount) {
        this.#allocation = {
          decls,
          context,
          map,
          assigned: this.declarePrivate('assigned'),
          missingCount: this.declarePrivate('missingCount'),
        };
      } else {
        this.#allocation = {
          decls,
          context,
          map,
        };
      }
    }

    return this.#allocation;
  }

  protected override declareConstructor({ context }: UcrxArgs.ByName): UccSource {
    const {
      decls: { requiredCount },
      context: contextVar,
      map,
      assigned,
      missingCount,
    } = this.#getAllocation();

    return code => {
      code.write(`${contextVar} = ${context};`);
      if (missingCount) {
        code.write(`${missingCount} = ${requiredCount};`, `${assigned} = {};`);
      }
      code.write(this.allocateMap(`${map} = [`, '];'));
    };
  }

  protected override overrideMethods(): UcrxTemplate.MethodDecls | undefined {
    return {
      nul: this.schema.nullable ? () => this.#declareNul() : undefined,
      for: args => this.#declareFor(args),
      map: args => this.#declareMap(args),
    };
  }

  #declareEntries(): string {
    const { entries } = this.schema;
    const { lib } = this;

    return lib.declarations.declare(`${this.className}$entries`, ({ init }) => init(code => {
        code
          .write(`{`)
          .indent(code => {
            for (const [key, entrySchema] of Object.entries<UcSchema>(entries)) {
              const entry = this.createEntry(key, entrySchema);

              code.write(
                entry.declare(init => code => {
                  code.inline(quoteJsKey(key), ': ', init, ',');
                }),
              );
            }
          })
          .write(`}`);
      }));
  }

  #declareExtra(): string | undefined {
    const { extra } = this.schema;

    if (!extra) {
      return;
    }

    const { lib } = this;
    const entry = this.createEntry(null, extra);

    return lib.declarations.declare(`${this.className}$extra`, ({ init }) => entry.declare(init));
  }

  entryTemplate(key: string | null, schema: UcSchema): UcrxTemplate {
    try {
      return this.lib.ucrxTemplateFor(schema);
    } catch (cause) {
      const entryName = key != null ? `entry "${escapeJsString(key)}"` : 'extra entry';

      throw new UnsupportedUcSchemaError(
        schema,
        `${ucSchemaTypeSymbol(
          this.schema,
        )}: Can not deserialize ${entryName} of type "${ucModelName(schema)}"`,
        { cause },
      );
    }
  }

  createEntry(key: string | null, schema: UcSchema): MapUcrxEntry {
    return new MapUcrxEntry(this as MapUcrxTemplate, key, schema);
  }

  allocateMap(prefix: string, suffix: string): UccSource {
    return `${prefix}{}${suffix}`;
  }

  storeMap(setter: string, allocation: MapUcrxTemplate.Allocation): UccSource;
  storeMap(setter: string, { map }: MapUcrxTemplate.Allocation): UccSource {
    return `${setter}(${map}[0]);`;
  }

  reclaimMap(allocation: MapUcrxTemplate.Allocation): UccSource;
  reclaimMap({ map }: MapUcrxTemplate.Allocation): UccSource {
    // Allocate map instance for the next list item.
    return this.allocateMap(`${map}[0] = `, `;`);
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

  #declareFor({ key, reject }: UccArgs.ByName<'key' | 'reject'>): UccSource {
    const {
      decls: { entries, extra },
      context,
      map,
      assigned,
      missingCount,
    } = this.#getAllocation();
    const rx = this.#varRx();
    const entry = this.#varEntry();
    const ucrxRejectEntry = this.lib.import(CHURI_MODULE, 'ucrxRejectEntry');

    return code => {
      code
        .write(`const ${entry} = ${entries}[${key}]` + (extra ? ` || ${extra};` : ';'))
        .write(`if (!${entry}) {`)
        .indent(`${reject}(${ucrxRejectEntry}(${key}));`, 'return;')
        .write('}')
        .write(`const ${rx} = ${entry}.rx(${context}, ${map}, ${key});`);
      if (missingCount) {
        code
          .write(`if (${entry}.use && !${assigned}[${key}]) {`)
          .indent(`--${missingCount};`, `${assigned}[${key}] = 1;`)
          .write('}');
      }
      code.write(`return ${rx};`);
    };
  }

  #declareMap({ reject }: UccArgs.ByName<'reject'>): UccSource {
    const allocation = this.#getAllocation();
    const {
      decls: { entries, requiredCount },
      missingCount,
      assigned,
    } = allocation;

    if (!assigned) {
      return code => {
        code.write(this.storeMap(`this.set`, allocation), this.reclaimMap(allocation), `return 1;`);
      };
    }

    const ucrxRejectMissingEntries = this.lib.import(CHURI_MODULE, 'ucrxRejectMissingEntries');

    return code => {
      code
        .write(`if (${missingCount}) {`)
        .indent(`${reject}(${ucrxRejectMissingEntries}(${assigned}, ${entries}));`, 'return 0;')
        .write(`} else {`)
        .indent(this.storeMap(`this.set`, allocation))
        .write(`}`)
        .write(`${missingCount} = ${requiredCount};`)
        .write(this.reclaimMap(allocation))
        .write(`${assigned} = {};`)
        .write(`return 1;`);
    };
  }

  #declareNul(): UccSource {
    return `return this.set(null);`;
  }

}

export namespace MapUcrxTemplate {
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
