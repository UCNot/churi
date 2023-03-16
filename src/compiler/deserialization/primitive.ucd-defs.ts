import { Ucrx } from '../../rx/ucrx.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxLocation } from '../rx/ucrx-location.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UccCode } from '../ucc-code.js';
import { UcdDef } from './ucd-def.js';

export class Primitive$UcdDefs {

  readonly #list: UcdDef[];
  readonly #templates: { [key in keyof Ucrx]?: UcrxTemplate<any, any, any> } = {};

  constructor() {
    this.#list = [
      { type: Boolean, deserialize: this.#initBooleanRx.bind(this) },
      { type: BigInt, deserialize: this.#initBigIntRx.bind(this) },
      { type: Number, deserialize: this.#initNumberRx.bind(this) },
      { type: String, deserialize: this.#initStringRx.bind(this) },
    ];
  }

  get list(): readonly UcdDef[] {
    return this.#list;
  }

  #initBooleanRx(location: UcrxLocation<boolean>): UccCode.Source {
    return this.#createRxFor('bol', location);
  }

  #initBigIntRx(location: UcrxLocation<bigint>): UccCode.Source {
    return this.#createRxFor('big', location);
  }

  #initNumberRx(location: UcrxLocation<number>): UccCode.Source {
    return this.#createRxFor('num', location);
  }

  #initStringRx(location: UcrxLocation<string>): UccCode.Source {
    return this.#createRxFor('str', location);
  }

  #createRxFor<T, TSchema extends UcSchema<T>, TArg extends string>(
    key: 'bol' | 'big' | 'num' | 'str',
    location: UcrxLocation<T, TSchema, TArg>,
  ): UccCode.Source {
    return this.#ucrxTemplateFor(key, location).newInstance(location);
  }

  #ucrxTemplateFor<T, TSchema extends UcSchema<T>, TArg extends string>(
    key: 'bol' | 'big' | 'num' | 'str',
    { lib, schema }: UcrxLocation<T, TSchema, TArg>,
  ): UcrxTemplate<T, TSchema, TArg> {
    const template = this.#templates[key];

    if (template) {
      return template;
    }

    const newTemplate = new UcrxTemplate<T, TSchema, TArg>({
      lib,
      schema,
      className: `${key[0].toUpperCase()}${key.slice(1)}Ucrx`,
      methods: {
        [key]({ args: { value }, prefix, suffix }: UcrxMethod.Location<'value'>): UccCode.Source {
          return `${prefix}this.set(${value})${suffix}`;
        },
      },
    });

    this.#templates[key] = newTemplate;

    return newTemplate;
  }

}

export const PrimitiveUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new Primitive$UcdDefs().list;
