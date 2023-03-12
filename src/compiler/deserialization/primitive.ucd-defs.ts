import { Ucrx } from '../../rx/ucrx.js';
import { UccCode } from '../ucc-code.js';
import { UcdDef } from './ucd-def.js';
import { UcdUcrx, UcdUcrxLocation } from './ucd-ucrx.js';

export class Primitive$UcdDefs {

  readonly #list: UcdDef[];

  constructor() {
    this.#list = [
      { type: Boolean, initRx: this.#initBooleanRx.bind(this) },
      { type: BigInt, initRx: this.#initBigIntRx.bind(this) },
      { type: Number, initRx: this.#initNumberRx.bind(this) },
      { type: String, initRx: this.#initStringRx.bind(this) },
    ];
  }

  get list(): readonly UcdDef[] {
    return this.#list;
  }

  #initBooleanRx(location: UcdUcrxLocation<boolean>): UcdUcrx {
    return this.#createRxFor('bol', location);
  }

  #initBigIntRx(location: UcdUcrxLocation): UcdUcrx {
    return this.#createRxFor('big', location);
  }

  #initNumberRx(location: UcdUcrxLocation): UcdUcrx {
    return this.#createRxFor('num', location);
  }

  #initStringRx(location: UcdUcrxLocation): UcdUcrx {
    return this.#createRxFor('str', location);
  }

  #createRxFor(key: keyof Ucrx, { schema, setter }: UcdUcrxLocation): UcdUcrx {
    return {
      properties: {
        [key]:
          (prefix: string, suffix: string): UccCode.Source => code => {
            code.write(`${prefix}${setter}${suffix}`);
          },
        nul: schema.nullable
          ? (prefix, suffix) => code => {
              code.write(`${prefix}() => ${setter}(null)${suffix}`);
            }
          : undefined,
      },
    };
  }

}

export const PrimitiveUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new Primitive$UcdDefs().list;
