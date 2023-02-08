import { UcdValueRx } from '../../deserializer/ucd-rx.js';
import { UcPrimitive } from '../../schema/uc-primitive.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcdDef } from './ucd-def.js';
import { UcdFunction } from './ucd-function.js';

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

  #readBoolean(fn: UcdFunction, schema: UcSchema<boolean>, setter: string): UccCode.Source {
    return this.#readPrimitive(fn, schema, setter, 'bol');
  }

  #readBigInt(fn: UcdFunction, schema: UcSchema<bigint>, setter: string): UccCode.Source {
    return this.#readPrimitive(fn, schema, setter, 'big');
  }

  #readNumber(fn: UcdFunction, schema: UcSchema<number>, setter: string): UccCode.Source {
    return this.#readPrimitive(fn, schema, setter, 'num');
  }

  #readString(fn: UcdFunction, schema: UcSchema<string>, setter: string): UccCode.Source {
    return this.#readPrimitive(fn, schema, setter, 'str');
  }

  #readPrimitive(
    { args: { reader } }: UcdFunction,
    schema: UcSchema<UcPrimitive>,
    setter: string,
    name: keyof UcdValueRx,
  ): UccCode.Source {
    return code => {
      code
        .write(`await ${reader}.read({`)
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
        .write(`});`);
    };
  }

}

export const DefaultUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new Default$UcdDefs().list;
