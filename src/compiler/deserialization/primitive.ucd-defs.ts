import { UcrxItem } from '../../rx/ucrx.js';
import { UcPrimitive } from '../../schema/uc-primitive.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcdDef } from './ucd-def.js';
import { UcdTypeDef } from './ucd-type-def.js';

export class Primitive$UcdDefs {

  readonly #list: UcdDef[];

  constructor() {
    this.#list = [
      { type: Boolean, deserialize: this.#readBoolean.bind(this) },
      { type: BigInt, deserialize: this.#readBigInt.bind(this) },
      { type: Number, deserialize: this.#readNumber.bind(this) },
      { type: String, deserialize: this.#readString.bind(this) },
    ];
  }

  get list(): readonly UcdDef[] {
    return this.#list;
  }

  #readBoolean(schema: UcSchema<boolean>, location: UcdTypeDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'bol');
  }

  #readBigInt(schema: UcSchema<bigint>, location: UcdTypeDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'big');
  }

  #readNumber(schema: UcSchema<number>, location: UcdTypeDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'num');
  }

  #readString(schema: UcSchema<string>, location: UcdTypeDef.Location): UccCode.Source {
    return this.#readPrimitive(schema, location, 'str');
  }

  #readPrimitive(
    schema: UcSchema<UcPrimitive>,
    { setter, prefix, suffix }: UcdTypeDef.Location,
    name: keyof UcrxItem,
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

export const PrimitiveUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new Primitive$UcdDefs().list;
