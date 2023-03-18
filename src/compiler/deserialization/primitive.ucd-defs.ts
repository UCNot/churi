import { Ucrx } from '../../rx/ucrx.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UccCode } from '../ucc-code.js';
import { UcdDef } from './ucd-def.js';

export class Primitive$UcdDefs {

  readonly #list: UcdDef[];
  readonly #templates: { [key in keyof Ucrx]?: UcrxTemplate } = {};

  constructor() {
    this.#list = [
      { type: Boolean, createTemplate: this.#forBoolean.bind(this) },
      { type: BigInt, createTemplate: this.#forBigInt.bind(this) },
      { type: Number, createTemplate: this.#forNumber.bind(this) },
      { type: String, createTemplate: this.#forString.bind(this) },
    ];
  }

  get list(): readonly UcdDef[] {
    return this.#list;
  }

  #forBoolean(lib: UcrxLib, schema: UcSchema<boolean>): UcrxTemplate<boolean> {
    return this.#for(lib, schema, 'bol');
  }

  #forBigInt(lib: UcrxLib, schema: UcSchema<bigint>): UcrxTemplate<bigint> {
    return this.#for(lib, schema, 'big');
  }

  #forNumber(lib: UcrxLib, schema: UcSchema<number>): UcrxTemplate<number> {
    return this.#for(lib, schema, 'num');
  }

  #forString(lib: UcrxLib, schema: UcSchema<string>): UcrxTemplate<string> {
    return this.#for(lib, schema, 'str');
  }

  #for<T, TSchema extends UcSchema<T>>(
    lib: UcrxLib,
    schema: TSchema,
    key: 'bol' | 'big' | 'num' | 'str',
  ): UcrxTemplate<T, TSchema> {
    const template = this.#templates[key];

    if (template) {
      return template as UcrxTemplate<T, TSchema>;
    }

    return (this.#templates[key] = new UcrxTemplate<T, TSchema>({
      lib,
      schema,
      className: `${key[0].toUpperCase()}${key.slice(1)}Ucrx`,
      methods: {
        [key]({ args: { value } }: UcrxMethod.Location<'value'>): UccCode.Source {
          return `return this.set(${value});`;
        },
      },
    }));
  }

}

export const PrimitiveUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new Primitive$UcdDefs().list;
