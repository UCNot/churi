import { DESERIALIZER_MODULE } from '../../impl/module-names.js';
import { UccCode } from '../ucc-code.js';
import { UcdDef } from './ucd-def.js';
import { UcdEntityDef } from './ucd-entity-def.js';

export class NonFinite$UcdDefs {

  readonly #list: UcdDef[];

  constructor() {
    this.#list = [
      { entity: '!Infinity', addHandler: this.#readEntity.bind(this, 'ucdReadInfinity') },
      { entity: '!-Infinity', addHandler: this.#readEntity.bind(this, 'ucdReadNegativeInfinity') },
      { entity: '!NaN', addHandler: this.#readEntity.bind(this, 'ucdReadNaN') },
    ];
  }

  get list(): readonly UcdDef[] {
    return this.#list;
  }

  #readEntity(reader: string, { lib, prefix, suffix }: UcdEntityDef.Location): UccCode.Source {
    return `${prefix}${lib.import(DESERIALIZER_MODULE, reader)}${suffix}`;
  }

}

export const NonFiniteUcdDefs: readonly UcdDef[] = /*#__PURE__*/ new NonFinite$UcdDefs().list;
