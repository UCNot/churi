import { lazyValue } from '@proc7ts/primitives';
import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { quotePropertyKey } from '../../impl/quote-property-key.js';
import { UcMap } from '../../schema/uc-map.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { EntryUcdDef } from './entry.ucd-def.js';
import { UcdTypeDef } from './ucd-type-def.js';

export class MapUcdDef<TEntriesSpec extends UcMap.Schema.Entries.Spec = UcMap.Schema.Entries.Spec> {

  static get type(): string | UcSchema.Class {
    return 'map';
  }

  static deserialize<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    schema: UcMap.Schema<TEntriesSpec>,
    location: UcdTypeDef.Location,
  ): UccCode.Source {
    return schema.deserialize?.(schema, location) ?? new this(schema, location);
  }

  readonly #schema: UcMap.Schema<TEntriesSpec>;
  readonly #location: UcdTypeDef.Location;

  readonly #ns: UccNamespace;
  readonly #varEntry = lazyValue(() => this.#ns.name('entry'));
  readonly #varRx = lazyValue(() => this.#ns.name('rx'));

  constructor(schema: UcMap.Schema<TEntriesSpec>, location: UcdTypeDef.Location) {
    this.#schema = schema;
    this.#location = location;
    this.#ns = location.fn.ns.nest();
  }

  get schema(): UcMap.Schema<TEntriesSpec> {
    return this.#schema;
  }

  get location(): UcdTypeDef.Location {
    return this.#location;
  }

  #declareEntries(): string {
    const { entries } = this.schema;
    const { lib } = this.location.fn;
    const deserializer = lib.deserializerFor(this.schema);

    return lib.declarations.declare(`${deserializer.name}$entries`, (prefix, suffix) => code => {
      code
        .write(`${prefix}{`)
        .indent(code => {
          for (const [key, entrySchema] of Object.entries<UcSchema>(entries)) {
            const entry = this.createEntry(key, entrySchema);

            code.write(entry.declare(`${quotePropertyKey(key)}: `, `,`));
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

    const { lib } = this.location.fn;
    const deserializer = this.location.fn.lib.deserializerFor(this.schema);
    const entry = this.createEntry(null, extra);

    return lib.declarations.declare(`${deserializer.name}$extra`, (prefix, suffix) => entry.declare(prefix, suffix));
  }

  createEntry(key: string | null, schema: UcSchema): EntryUcdDef {
    return new EntryUcdDef(this, key, schema);
  }

  allocateMap(prefix: string, suffix: string): UccCode.Source {
    return `${prefix}{}${suffix}`;
  }

  storeMap(setter: string, { map }: MapUcdDef.Allocation): UccCode.Source {
    return `${setter}(${map}[0]);`;
  }

  reclaimMap({ map }: MapUcdDef.Allocation): UccCode.Source {
    // Allocate map instance for the next list item.
    return this.allocateMap(`${map}[0] = `, `;`);
  }

  toCode(): UccCode.Source {
    const entries = this.#declareEntries();
    const extra = this.#declareExtra();
    const { schema, location } = this;
    const { setter, prefix, suffix } = location;
    const map = this.#ns.name('map');
    const assigned = this.#ns.name('assigned');
    const requiredCount = this.#countRequired();
    let allocation: MapUcdDef.Allocation;
    const decls: MapUcdDef.Decls = {
      entries,
      extra,
      requiredCount,
    };

    if (requiredCount) {
      allocation = {
        decls,
        map,
        assigned,
        missingCount: this.#ns.name('missingCount'),
      };
    } else {
      allocation = {
        decls,
        map,
      };
    }

    const { missingCount } = allocation;
    const key = this.#ns.name('key');

    return code => {
      if (missingCount) {
        code.write(`let ${missingCount} = ${requiredCount};`, `let ${assigned} = {};`);
      }

      code
        .write(this.allocateMap(`const ${map} = [`, '];'))
        .write(`${prefix}{`)
        .indent(code => {
          code
            .write(`_: {`)
            .indent(code => {
              code
                .write(`map: {`)
                .indent(code => {
                  code
                    .write(`for(${key}) {`)
                    .indent(this.#rxEntry(allocation, key))
                    .write(`},`)
                    .write(`end: () => {`)
                    .indent(this.#endMap(setter, allocation))
                    .write(`},`);
                })
                .write(`},`);
              if (schema.nullable) {
                code.write(`nul: () => ${setter}(null),`);
              }
            })
            .write('},');
        })
        .write(`}${suffix}`);
    };
  }

  #countRequired(): number {
    let requiredCount = 0;

    for (const { optional } of Object.values(this.#schema.entries)) {
      if (!optional) {
        ++requiredCount;
      }
    }

    return requiredCount;
  }

  #rxEntry(allocation: MapUcdDef.Allocation, key: string): UccCode.Source {
    const reader = this.location.fn.args.reader;
    const {
      decls: { entries, extra },
      map,
      assigned = 'null',
      missingCount,
    } = allocation;
    const rx = this.#varRx();
    const entry = this.#varEntry();

    return code => {
      code
        .write(`const ${entry} = ${entries}[${key}]` + (extra ? ` || ${extra};` : ';'))
        .write(`const ${rx} = ${entry}?.rx(${reader}, ${map}, ${key});`)
        .write(`if (${entry}?.use && !${assigned}[${key}]) {`)
        .indent(`--${missingCount};`, `${assigned}[${key}] = 1;`)
        .write('}')
        .write(`return ${rx};`);
    };
  }

  #endMap(setter: string, allocation: MapUcdDef.Allocation): UccCode.Source {
    const {
      decls: { entries, requiredCount },
      missingCount,
      assigned,
    } = allocation;

    if (!assigned) {
      return code => {
        code.write(this.storeMap(setter, allocation), this.reclaimMap(allocation));
      };
    }

    const {
      location: {
        fn: {
          lib,
          args: { reader },
        },
      },
    } = this;
    const entriesMissing = lib.import(DESERIALIZER_MODULE, 'ucdMissingEntriesError');

    return code => {
      code
        .write(`if (${missingCount}) {`)
        .indent(`${reader}.error(${entriesMissing}(${assigned}, ${entries}));`)
        .write(`} else {`)
        .indent(this.storeMap(setter, allocation))
        .write(`}`)
        .write(`${missingCount} = ${requiredCount};`)
        .write(this.reclaimMap(allocation))
        .write(`${assigned} = {};`);
    };
  }

}

export namespace MapUcdDef {
  export interface Decls {
    readonly entries: string;
    readonly extra: string | undefined;
    readonly requiredCount: number;
  }

  export type Allocation = Allocation.WithRequiredEntries | Allocation.WithOptionalEntries;
  export namespace Allocation {
    export interface WithRequiredEntries {
      readonly decls: Decls;
      readonly map: string;
      readonly assigned: string;
      readonly missingCount: string;
    }
    export interface WithOptionalEntries {
      readonly decls: Decls;
      readonly map: string;
      readonly assigned?: undefined;
      readonly missingCount?: undefined;
    }
  }
}
