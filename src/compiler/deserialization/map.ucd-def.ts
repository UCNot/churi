import { escapeJsString } from '../../impl/quote-property-key.js';
import { UcMap } from '../../schema/uc-map.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { uccPropertyAccessExpr } from '../ucc-expr.js';
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
  #setEntryVar?: string;
  #entryDeclsVar?: string;
  #entryValueVar?: string;

  readonly #ns: UccNamespace;
  #targetVar?: string;

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

  get targetVar(): string {
    return (this.#targetVar ??= this.#ns.name('target'));
  }

  get entryDeclsVar(): string {
    return (this.#entryDeclsVar ??= this.#declareEntries());
  }

  get setEntryVar(): string {
    return (this.#setEntryVar ??= this.#entryNs.name('setEntry'));
  }

  get entryValueVar(): string {
    return (this.#entryValueVar ??= this.#entryNs.name('entryValue'));
  }

  #declareEntries(): string {
    const { entries } = this.schema;
    const { fn } = this.location;
    const {
      lib,
      args: { reader },
    } = fn;
    const deserializer = lib.deserializerFor(this.schema);

    return lib.declarations.declare(`${deserializer.name}$entries`, (prefix, suffix) => code => {
      code
        .write(`${prefix}{`)
        .indent(code => {
          for (const [key, entrySchema] of Object.entries<UcSchema>(entries)) {
            code
              .write(`${escapeJsString(key)}(${reader}, ${this.targetVar}){`)
              .indent(this.declareEntry(key, entrySchema))
              .write(`},`);
          }
        })
        .write(`}${suffix}`);
    });
  }

  declareEntry(key: string, entrySchema: UcSchema): UccCode.Source {
    const { fn } = this.location;

    return code => {
      code
        .write(`const ${this.setEntryVar} = ${this.entryValueVar} => {`)
        .indent(
          `${uccPropertyAccessExpr(this.targetVar, key)} = ${this.entryValueVar};`,
          'return 1;',
        )
        .write(`};`);

      try {
        code.write(
          fn.deserialize(entrySchema, {
            setter: this.setEntryVar,
            prefix: 'return ',
            suffix: ';',
          }),
        );
      } catch (cause) {
        throw new UnsupportedUcSchemaError(
          entrySchema,
          `${fn.name}: Can not deserialize entry "${escapeJsString(key)}" of type "${ucSchemaName(
            entrySchema,
          )}"`,
          { cause },
        );
      }
    };
  }

  createMap(): UccCode.Source {
    return `let ${this.targetVar} = {};`;
  }

  setEntry(key: string, prefix: string, suffix: string): UccCode.Source {
    return `${prefix}${this.entryDeclsVar}[${key}]?.(${this.location.fn.args.reader}, ${this.targetVar})${suffix}`;
  }

  endMap(): UccCode.Source {
    return code => code.write(`${this.location.setter}(${this.targetVar});`, `${this.targetVar} = {};`);
  }

  toCode(): UccCode.Source {
    const { schema, location } = this;
    const { setter, prefix, suffix } = location;
    const key = this.#ns.name('key');

    return code => {
      code
        .write(this.createMap())
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
                    .indent(this.setEntry(key, 'return ', ';'))
                    .write(`},`)
                    .write(`end: () => {`)
                    .indent(this.endMap())
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
