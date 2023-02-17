import { UcdValueRx } from '../../deserializer/ucd-rx.js';
import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { escapeJsString } from '../../impl/quote-property-key.js';
import { UcList } from '../../schema/uc-list.js';
import { UcMap } from '../../schema/uc-map.js';
import { UcPrimitive } from '../../schema/uc-primitive.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { uccPropertyAccessExpr } from '../ucc-expr.js';
import { UcdDef } from './ucd-def.js';

export class Default$UcdDefs {

  readonly #list: UcdDef[];

  constructor() {
    this.#list = [
      {
        type: Boolean,
        deserialize: this.#readBoolean.bind(this),
      },
      {
        type: BigInt,
        deserialize: this.#readBigInt.bind(this),
      },
      {
        type: 'list',
        deserialize: this.#readList.bind(this),
      },
      {
        type: 'map',
        deserialize: this.#readMap.bind(this),
      },
      {
        type: Number,
        deserialize: this.#readNumber.bind(this),
      },
      {
        type: String,
        deserialize: this.#readString.bind(this),
      },
    ];
  }

  get list(): readonly UcdDef[] {
    return this.#list;
  }

  #readBoolean(schema: UcSchema<boolean>, location: UcdDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'bol');
  }

  #readBigInt(schema: UcSchema<bigint>, location: UcdDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'big');
  }

  #readList(
    { nullable, item }: UcList.Schema,
    { fn, setter, prefix, suffix }: UcdDef.Location,
  ): UccCode.Source {
    const {
      lib,
      ns,
      args: { reader },
    } = fn;
    const readUcList = lib.import(DESERIALIZER_MODULE, 'readUcList');

    return code => {
      const listRx = ns.name('listRx');
      const addItem = ns.name('addItem');

      const nullableFlag = (nullable ? 1 : 0) | (item.nullable ? 2 : 0);

      code
        .write(`const ${listRx} = ${readUcList}(${reader}, ${setter}, ${addItem} => {`)
        .indent(fn.deserialize(item, { setter: addItem, prefix: 'return ', suffix: ';' }))
        .write(nullableFlag ? `}, ${nullableFlag});` : `});`)
        .write(`${prefix}${listRx}.rx${suffix}`)
        .write(`${listRx}.end();`);
    };
  }

  #readMap<TEntriesSpec extends UcMap.Schema.Entries.Spec>(
    schema: UcMap.Schema<TEntriesSpec>,
    { fn, setter, prefix, suffix }: UcdDef.Location,
  ): UccCode.Source {
    const { entries } = schema;
    const {
      lib,
      args: { reader },
    } = fn;
    const serializer = lib.deserializerFor(schema);
    const { ns, declarations } = lib;
    const targetMap = ns.name('targetMap');
    const setEntry = ns.name('setEntry');
    const entryValue = ns.name('entryValue');

    const entryDecls = declarations.declare(
      `${serializer.name}$entries`,
      (prefix, suffix) => code => {
        code
          .write(`${prefix}{`)
          .indent(code => {
            for (const [key, entrySchema] of Object.entries<UcSchema>(entries)) {
              code
                .write(`${escapeJsString(key)}(${reader}, ${targetMap}){`)
                .indent(code => {
                  code
                    .write(`const ${setEntry} = ${entryValue} => {`)
                    .indent(
                      `${uccPropertyAccessExpr(targetMap, key)} = ${entryValue};`,
                      'return 1;',
                    )
                    .write(`};`)
                    .write(
                      fn.deserialize(entrySchema, {
                        setter: setEntry,
                        prefix: 'return ',
                        suffix: ';',
                      }),
                    );
                })
                .write(`},`);
            }
          })
          .write(`}${suffix}`);
      },
    );

    return code => {
      code
        .write(`const ${targetMap} = {};`)
        .write(`${prefix}{`)
        .indent(code => {
          code
            .write(`_: {`)
            .indent(code => {
              code
                .write(`map: {`)
                .indent(code => {
                  code.write(
                    `for: key => ${entryDecls}[key]?.(${reader}, ${targetMap}),`,
                    `end: () => ${setter}(${targetMap}),`,
                  );
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

  #readNumber(schema: UcSchema<number>, location: UcdDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'num');
  }

  #readString(schema: UcSchema<string>, location: UcdDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'str');
  }

  #readPrimitive(
    schema: UcSchema<UcPrimitive>,
    { setter, prefix, suffix }: UcdDef.Location,
    name: keyof UcdValueRx,
  ): UccCode.Source {
    return code => {
      code
        .write(`${prefix}{`)
        .indent(code => {
          code
            .write('_: {')
            .indent(code => {
              code.write(`${name}: ${setter},`);
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

export const DefaultUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new Default$UcdDefs().list;
