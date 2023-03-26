import { CHURI_MODULE } from '../../impl/module-names.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxSetter } from './ucrx-setter.js';

export type UcrxCore = {
  readonly bol: UcrxSetter;
  readonly big: UcrxSetter;
  readonly ent: UcrxSetter;
  readonly nls: UcrxMethod<''>;
  readonly num: UcrxSetter;
  readonly str: UcrxSetter;
  readonly for: UcrxMethod<'key'>;
  readonly map: UcrxMethod<''>;
  readonly em: UcrxMethod<''>;
  readonly ls: UcrxMethod<''>;
  readonly any: UcrxSetter;
  readonly nul: UcrxMethod<''>;
};

export const UcrxCore: UcrxCore = {
  bol: /*#__PURE__*/ new UcrxSetter({ key: 'bol', typeName: 'boolean' }),
  big: /*#__PURE__*/ new UcrxSetter({ key: 'big', typeName: 'bigint' }),
  ent: /*#__PURE__*/ new UcrxSetter({
    key: 'ent',
    stub({ value }, _method, { lib }) {
      const UcEntity = lib.import(CHURI_MODULE, 'UcEntity');

      return `return this.any(new ${UcEntity}(${value}));`;
    },
    typeName: 'entity',
  }),
  nls: /*#__PURE__*/ new UcrxMethod<''>({
    key: 'nls',
    args: [],
    stub: () => UccCode.none,
    typeName: 'nested list',
  }),
  num: /*#__PURE__*/ new UcrxSetter({ key: 'num', typeName: 'number' }),
  str: /*#__PURE__*/ new UcrxSetter({ key: 'str', typeName: 'string' }),
  for: /*#__PURE__*/ new UcrxMethod({
    key: 'for',
    args: ['key'],
    stub: () => UccCode.none,
  }),
  map: /*#__PURE__*/ new UcrxMethod<''>({
    key: 'map',
    args: [],
    stub: () => UccCode.none,
    typeName: 'map',
  }),
  em: /*#__PURE__*/ new UcrxMethod<''>({
    key: 'em',
    args: [],
    stub: () => `return 0;`,
  }),
  ls: /*#__PURE__*/ new UcrxMethod<''>({
    key: 'ls',
    args: [],
    stub: () => UccCode.none,
  }),
  any: /*#__PURE__*/ new UcrxSetter({ key: 'any', typeName: 'any' }),
  nul: /*#__PURE__*/ new UcrxMethod<''>({
    key: 'nul',
    args: [],
    typeName: 'null',
    stub: () => `return this.any(null);`,
  }),
};
