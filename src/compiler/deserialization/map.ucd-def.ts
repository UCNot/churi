import { lazyValue } from '@proc7ts/primitives';
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

  declareExtraRx(): string | undefined {
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
        .indent(this.setEntry(targetMap, argKey, entryValue), 'return 1;')
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
    targetMap: string,
    key: string,
    prefix: string,
    suffix: string,
  ): UccCode.Source {
    return `${prefix}${rxs}[${key}]?.(${this.location.fn.args.reader}, ${targetMap}, ${key})${suffix}`;
  }

  rxExtra(
    extraRx: string,
    targetMap: string,
    key: string,
    prefix: string,
    suffix: string,
  ): UccCode.Source {
    return `${prefix}${extraRx}(${this.location.fn.args.reader}, ${targetMap}, ${key})${suffix}`;
  }

  storeMap(setter: string, targetMap: string): UccCode.Source {
    return `${setter}(${targetMap});`;
  }

  reclaimMap(targetMap: string): UccCode.Source {
    // Allocate map instance for the next list item.
    return this.allocateMap(`${targetMap} = `, `;`);
  }

  toCode(): UccCode.Source {
    const rxs = this.declareRxs();
    const extraRx = this.declareExtraRx();
    const { schema, location } = this;
    const { setter, prefix, suffix } = location;
    const targetMap = this.#ns.name('targetMap');
    const key = this.#ns.name('key');

    return code => {
      code
        .write(this.allocateMap(`let ${targetMap} = `, ';'))
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
                    .indent(code => {
                      if (extraRx) {
                        code
                          .write(this.rxEntry(rxs, targetMap, key, 'return ', ''))
                          .indent(this.rxExtra(extraRx, targetMap, key, '?? ', ';'));
                      } else {
                        code.write(this.rxEntry(rxs, targetMap, key, 'return ', ';'));
                      }
                    })
                    .write(`},`)
                    .write(`end: () => {`)
                    .indent(this.storeMap(setter, targetMap), this.reclaimMap(targetMap))
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

}
