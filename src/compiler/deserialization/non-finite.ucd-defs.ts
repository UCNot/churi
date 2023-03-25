import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcdDef } from './ucd-def.js';
import { UcdEntityDef } from './ucd-entity-def.js';

export class NonFinite$UcdDefs {

  readonly #list: UcdDef[];

  constructor() {
    this.#list = [
      { entity: '!Infinity', createRx: this.#createRx.bind(this, 'ucrxInfinity') },
      { entity: '!-Infinity', createRx: this.#createRx.bind(this, 'ucrxNegativeInfinity') },
      { entity: '!NaN', createRx: this.#createRx.bind(this, 'ucrxNaN') },
    ];
  }

  get list(): readonly UcdDef[] {
    return this.#list;
  }

  #createRx(reader: string, { lib, prefix, suffix }: UcdEntityDef.Location): UccCode.Source {
    return `${prefix}${lib.import(DESERIALIZER_MODULE, reader)}${suffix}`;
  }

}

export const NonFiniteUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new NonFinite$UcdDefs().list;
