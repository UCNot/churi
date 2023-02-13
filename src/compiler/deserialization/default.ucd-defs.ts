import { UcdValueRx } from '../../deserializer/ucd-rx.js';
import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcList } from '../../schema/uc-list.js';
import { UcPrimitive } from '../../schema/uc-primitive.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
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
    { item }: UcList.Schema,
    { fn, setter, prefix, suffix }: UcdDef.Location,
  ): UccCode.Source {
    const {
      lib,
      aliases,
      args: { reader },
    } = fn;
    const readUcList = lib.import(DESERIALIZER_MODULE, 'readUcList');

    return code => {
      const listRx = aliases.aliasFor('listRx');
      const addItem = aliases.aliasFor('addItem');

      code
        .write(`const ${listRx} = ${readUcList}(${reader}, ${setter}, ${addItem} => {`)
        .indent(fn.deserialize(item, { setter: addItem, prefix: 'return ', suffix: ';' }))
        .write(`});`)
        .write(`${prefix}${listRx}.rx${suffix}`)
        .write(`${listRx}.end();`);
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
