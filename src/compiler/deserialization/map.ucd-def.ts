import { lazyValue } from '@proc7ts/primitives';
import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { escapeJsString, quotePropertyKey } from '../../impl/quote-property-key.js';
import { UcMap } from '../../schema/uc-map.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcdTypeDef } from './ucd-type-def.js';

export class MapUcdDef<TEntriesSpec extends UcMap.Schema.Entries.Spec> implements UccCode.Fragment {

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

  readonly #entryNs: UccNamespace;
  readonly #varEntrySetter = lazyValue(() => this.#entryNs.name('setEntry'));
  readonly #argEntryValue = lazyValue(() => this.#entryNs.name('entryValue'));

  readonly #ns: UccNamespace;
  readonly #varEntryRx = lazyValue(() => this.#ns.name('entryRx'));
  readonly #argTargetMap = lazyValue(() => this.#entryNs.name('targetMap'));
  readonly #argEntryKey = lazyValue(() => this.#entryNs.name('entryKey'));

  constructor(schema: UcMap.Schema<TEntriesSpec>, location: UcdTypeDef.Location) {
    this.#schema = schema;
    this.#location = location;
    this.#entryNs = location.fn.lib.ns.nest();
    this.#ns = location.fn.ns.nest();
  }

  get schema(): UcMap.Schema<TEntriesSpec> {
    return this.#schema;
  }

  get location(): UcdTypeDef.Location {
    return this.#location;
  }

  declareRxs(): string {
    const { entries } = this.schema;
    const { fn } = this.location;
    const {
      lib,
      args: { reader },
    } = fn;
    const deserializer = lib.deserializerFor(this.schema);
    const targetMap = this.#argTargetMap();
    const argKey = this.#argEntryKey();

    return lib.declarations.declare(`${deserializer.name}$rx`, (prefix, suffix) => code => {
      code
        .write(`${prefix}{`)
        .indent(code => {
          for (const [key, entrySchema] of Object.entries<UcSchema>(entries)) {
            code
              .write(`${quotePropertyKey(key)}(${reader}, ${targetMap}, ${argKey}){`)
              .indent(this.declareEntryRx(targetMap, key, argKey, entrySchema))
              .write(`},`);
          }
        })
        .write(`}${suffix}`);
    });
  }

  declareRxExtra(): string | undefined {
    const { extra } = this.schema;

    if (!extra) {
      return;
    }

    const { fn } = this.location;
    const {
      lib,
      args: { reader },
    } = fn;
    const deserializer = lib.deserializerFor(this.schema);
    const targetMap = this.#argTargetMap();
    const entryKey = this.#argEntryKey();

    return lib.declarations.declare(`${deserializer.name}$rxExtra`, (prefix, suffix) => code => {
      code
        .write(`${prefix}(${reader}, ${targetMap}, ${entryKey}) => {`)
        .indent(this.declareEntryRx(targetMap, null, entryKey, extra))
        .write(`}${suffix}`);
    });
  }

  declareEntryRx(
    targetMap: string,
    key: string | null,
    argKey: string,
    entrySchema: UcSchema,
  ): UccCode.Source {
    const { fn } = this.location;
    const setEntry = this.#varEntrySetter();
    const entryValue = this.#argEntryValue();

    return code => {
      code
        .write(`const ${setEntry} = ${entryValue} => {`)
        .indent(this.setEntry(`${targetMap}[0]`, argKey, entryValue), 'return 1;')
        .write(`};`);

      try {
        code.write(
          fn.deserialize(entrySchema, {
            setter: setEntry,
            prefix: 'return ',
            suffix: ';',
          }),
        );
      } catch (cause) {
        const entryName = key != null ? `entry "${escapeJsString(key)}"` : 'extra entry';

        throw new UnsupportedUcSchemaError(
          entrySchema,
          `${fn.name}: Can not deserialize ${entryName} of type "${ucSchemaName(entrySchema)}"`,
          { cause },
        );
      }
    };
  }

  setEntry(targetMap: string, entryKey: string, value: string): UccCode.Source {
    return `${targetMap}[${entryKey}] = ${value};`;
  }

  allocateMap(prefix: string, suffix: string): UccCode.Source {
    return `${prefix}{}${suffix}`;
  }

  rxEntry(
    rxs: string,
    { targetMap }: MapUcdDef.Allocation,
    key: string,
    prefix: string,
    suffix: string,
  ): UccCode.Source {
    return `${prefix}${rxs}[${key}]?.(${this.location.fn.args.reader}, ${targetMap}, ${key})${suffix}`;
  }

  rxExtra(
    { decls: { rxExtra }, targetMap }: MapUcdDef.Allocation,
    key: string,
    prefix: string,
    suffix: string,
  ): UccCode.Source {
    return `${prefix}${rxExtra}(${this.location.fn.args.reader}, ${targetMap}, ${key})${suffix}`;
  }

  storeMap(setter: string, { targetMap }: MapUcdDef.Allocation): UccCode.Source {
    return `${setter}(${targetMap}[0]);`;
  }

  reclaimMap({ targetMap }: MapUcdDef.Allocation): UccCode.Source {
    // Allocate map instance for the next list item.
    return this.allocateMap(`${targetMap}[0] = `, `;`);
  }

  toCode(): UccCode.Source {
    const rxs = this.declareRxs();
    const rxExtra = this.declareRxExtra();
    const { schema, location } = this;
    const { setter, prefix, suffix } = location;
    const targetMap = this.#ns.name('targetMap');
    const rxCache = this.#ns.name('rxCache');
    const lists = this.#ns.name('lists');
    const entriesSet = this.#ns.name('entriesSet');
    const [requiredCount, required] = this.#declareRequired();
    let allocation: MapUcdDef.Allocation;

    if (required) {
      allocation = {
        decls: {
          rxs,
          rxExtra,
          requiredCount,
          required,
        },
        targetMap,
        rxCache,
        lists,
        entriesSet,
        missingCount: this.#ns.name('missingCount'),
      };
    } else {
      allocation = {
        decls: {
          rxs,
          rxExtra,
          requiredCount: 0,
        },
        targetMap,
        rxCache,
        lists,
      };
    }

    const { missingCount } = allocation;
    const key = this.#ns.name('key');

    return code => {
      code.write(`const ${rxCache} = {};`, `const ${lists} = {};`);
      if (missingCount) {
        code.write(`let ${missingCount} = ${requiredCount};`, `let ${entriesSet} = {};`);
      }

      code
        .write(this.allocateMap(`const ${targetMap} = [`, '];'))
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

  #declareRequired(): [number, string] | [0] {
    let requiredCount = 0;
    const init = new UccCode();

    for (const [key, { optional }] of Object.entries(this.#schema.entries)) {
      if (!optional) {
        ++requiredCount;
        init.write(`${quotePropertyKey(key)}: 1,`);
      }
    }

    if (!requiredCount) {
      return [0];
    }

    const {
      location: {
        fn: { lib },
      },
    } = this;

    const deserializer = lib.deserializerFor(this.schema);

    return [
      requiredCount,
      lib.declarations.declare(
        `${deserializer.name}$required`,
        (prefix, suffix) => code => code.write(`${prefix}{`).indent(init).write(`}${suffix}`),
      ),
    ];
  }

  #rxEntry(allocation: MapUcdDef.Allocation, key: string): UccCode.Source {
    const {
      decls: { rxs, rxExtra, required },
      rxCache,
      entriesSet,
      missingCount,
    } = allocation;
    const entryRx = this.#varEntryRx();

    return code => {
      code
        .write(`let ${entryRx} = ${rxCache}[${key}];`)
        .write(`if (!${entryRx}) {`)
        .indent(code => {
          code.write(this.rxEntry(rxs, allocation, key, `${entryRx} = `, ';'));

          if (rxExtra) {
            code
              .write(`if (!${entryRx}) {`)
              .indent(this.rxExtra(allocation, key, `${entryRx} = `, ';'))
              .write(`}`);
          }
        })
        .write(`}`)
        .write(`if (${entryRx}) {`)
        .indent(code => {
          if (entriesSet) {
            code
              .write(`if (${required}[${key}] && !${entriesSet}[${key}]) {`)
              .indent(`${entriesSet}[${key}] = 1;`, `--${missingCount};`)
              .write(`}`);
          }
          code.write(`return ${rxCache}[${key}] = ${entryRx};`);
        })
        .write(`}`);
    };
  }

  #endMap(setter: string, allocation: MapUcdDef.Allocation): UccCode.Source {
    const {
      decls: { requiredCount, required },
      missingCount,
      entriesSet,
    } = allocation;

    if (!entriesSet) {
      return code => {
        code.write(this.storeMap(setter, allocation));
        code.write(this.reclaimMap(allocation));
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
        .indent(`${reader}.error(${entriesMissing}(${entriesSet}, ${required}))`)
        .write(`} else {`)
        .indent(this.storeMap(setter, allocation))
        .write(`}`)
        .write(`${missingCount} = ${requiredCount};`)
        .write(`${entriesSet} = {};`)
        .write(this.reclaimMap(allocation));
    };
  }

}

export namespace MapUcdDef {
  export type Decls = Decls.WithRequiredEntries | Decls.WithOptionalEntries;

  export namespace Decls {
    export interface WithRequiredEntries {
      readonly rxs: string;
      readonly rxExtra: string | undefined;
      readonly requiredCount: number;
      readonly required: string;
    }

    export interface WithOptionalEntries {
      readonly rxs: string;
      readonly rxExtra: string | undefined;
      readonly requiredCount: 0;
      readonly required?: undefined;
    }
  }

  export type Allocation = Allocation.WithRequiredEntries | Allocation.WithOptionalEntries;
  export namespace Allocation {
    export interface WithRequiredEntries {
      readonly decls: Decls.WithRequiredEntries;
      readonly targetMap: string;
      readonly rxCache: string;
      readonly lists: string;
      readonly entriesSet: string;
      readonly missingCount: string;
    }
    export interface WithOptionalEntries {
      readonly decls: Decls.WithOptionalEntries;
      readonly targetMap: string;
      readonly rxCache: string;
      readonly lists: string;
      readonly entriesSet?: undefined;
      readonly missingCount?: undefined;
    }
  }
}
