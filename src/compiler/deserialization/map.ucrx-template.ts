import { lazyValue } from '@proc7ts/primitives';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { escapeJsString, jsPropertyKey } from '../../impl/quote-property-key.js';
import { UcMap } from '../../schema/map/uc-map.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { ucUcSchemaVariant } from '../impl/uc-schema.variant.js';
import { CustomUcrxTemplate } from '../rx/custom.ucrx-template.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcrxArgs } from '../rx/ucrx.args.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { MapUcrxEntry } from './map.ucrx-entry.js';
import { UcdLib } from './ucd-lib.js';
import { UcdSetup } from './ucd-setup.js';

export class MapUcrxTemplate<
  TEntriesSpec extends UcMap.Schema.Entries.Spec = UcMap.Schema.Entries.Spec,
  TExtraSpec extends UcSchema.Spec | false = false,
> extends CustomUcrxTemplate<
  UcMap.ObjectType<TEntriesSpec, TExtraSpec>,
  UcMap.Schema<TEntriesSpec, TExtraSpec>
> {

  static configure(setup: UcdSetup): void {
    setup.useUcrxTemplate<UcMap, UcMap.Schema>('map', (lib, schema) => new this(lib, schema));
  }

  #typeName?: string;
  readonly #ns: UccNamespace;
  readonly #varEntry = lazyValue(() => this.#ns.name('entry'));
  readonly #varRx = lazyValue(() => this.#ns.name('rx'));
  #allocation?: MapUcrxTemplate.Allocation;

  constructor(lib: UcdLib, schema: UcMap.Schema<TEntriesSpec, TExtraSpec>) {
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

      this.#typeName = `Map${ucUcSchemaVariant(schema)}Of` + [...entryTypeNames].join('Or');
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
      map: () => this.#declareMap(),
    };
  }

  #declareEntries(): string {
    const { entries } = this.schema;
    const { lib } = this;

    return lib.declarations.declare(`${this.className}$entries`, (prefix, suffix) => code => {
      code
        .write(`${prefix}{`)
        .indent(code => {
          for (const [key, entrySchema] of Object.entries<UcSchema>(entries)) {
            const entry = this.createEntry(key, entrySchema);

            code.write(entry.declare(`${jsPropertyKey(key)}: `, `,`));
          }
        })
        .write(`}${suffix}`);
    });
  }

  #declareExtra(): string | undefined {
    const { extra } = this.schema;

    if (!extra) {
      return;
    }

    const { lib } = this;
    const entry = this.createEntry(null, extra);

    return lib.declarations.declare(`${this.className}$extra`, (prefix, suffix) => entry.declare(prefix, suffix));
  }

  entryTemplate(key: string | null, schema: UcSchema): UcrxTemplate {
    try {
      return this.lib.ucrxTemplateFor(schema);
    } catch (cause) {
      const entryName = key != null ? `entry "${escapeJsString(key)}"` : 'extra entry';

      throw new UnsupportedUcSchemaError(
        schema,
        `${ucSchemaName(this.schema)}: Can not deserialize ${entryName} of type "${ucSchemaName(
          schema,
        )}"`,
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

  #declareFor({ key }: UccArgs.ByName<'key'>): UccSource {
    const {
      decls: { entries, extra },
      context,
      map,
      assigned = 'null',
      missingCount,
    } = this.#getAllocation();
    const rx = this.#varRx();
    const entry = this.#varEntry();

    return code => {
      code
        .write(`const ${entry} = ${entries}[${key}]` + (extra ? ` || ${extra};` : ';'))
        .write(`const ${rx} = ${entry}?.rx(${context}, ${map}, ${key});`)
        .write(`if (${entry}?.use && !${assigned}[${key}]) {`)
        .indent(`--${missingCount};`, `${assigned}[${key}] = 1;`)
        .write('}')
        .write(`return ${rx};`);
    };
  }

  #declareMap(): UccSource {
    const allocation = this.#getAllocation();
    const {
      decls: { entries, requiredCount },
      context,
      missingCount,
      assigned,
    } = allocation;

    if (!assigned) {
      return code => {
        code.write(this.storeMap(`this.set`, allocation), this.reclaimMap(allocation), `return 1;`);
      };
    }

    const entriesMissing = this.lib.import(CHURI_MODULE, 'ucrxMissingEntriesError');

    return code => {
      code
        .write(`if (${missingCount}) {`)
        .indent(`${context}.error(${entriesMissing}(${assigned}, ${entries}));`)
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
