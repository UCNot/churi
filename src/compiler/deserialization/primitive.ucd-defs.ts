import { capitalize } from '../../impl/capitalize.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UccCode } from '../ucc-code.js';
import { UcdDef } from './ucd-def.js';

export class Primitive$UcdDefs {

  readonly #list: UcdDef[];

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
    return this.#forPrimitive(lib, schema, 'bol');
  }

  #forBigInt(lib: UcrxLib, schema: UcSchema<bigint>): UcrxTemplate<bigint> {
    return this.#forPrimitive(lib, schema, 'big');
  }

  #forNumber(lib: UcrxLib, schema: UcSchema<number>): UcrxTemplate<number> {
    return this.#forPrimitive(lib, schema, 'num');
  }

  #forString(lib: UcrxLib, schema: UcSchema<string>): UcrxTemplate<string> {
    return this.#forPrimitive(lib, schema, 'str');
  }

  #forPrimitive<T, TSchema extends UcSchema<T>>(
    lib: UcrxLib,
    schema: TSchema,
    key: 'bol' | 'big' | 'num' | 'str',
  ): UcrxTemplate<T, TSchema> {
    return new PrimitiveUcrxTemplate<T, TSchema>(lib, schema, key);
  }

}

export const PrimitiveUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new Primitive$UcdDefs().list;

class PrimitiveUcrxTemplate<T, TSchema extends UcSchema<T>> extends UcrxTemplate<T, TSchema> {

  readonly #key: 'bol' | 'big' | 'num' | 'str';

  constructor(lib: UcrxLib, schema: TSchema, key: 'bol' | 'big' | 'num' | 'str') {
    super({
      lib,
      schema,
      className: `${capitalize(ucSchemaSymbol(schema))}Ucrx`,
    });

    this.#key = key;
  }

  protected override declareMethods(): UcrxTemplate.MethodDecls {
    return {
      [this.#key]({ args: { value } }: UcrxMethod.Location<'value'>): UccCode.Source {
        return `return this.set(${value});`;
      },
      nul: this.schema.nullable ? _location => `return this.set(null);` : undefined,
    };
  }

}
