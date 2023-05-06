import { jsStringLiteral } from 'httongue';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxSetter } from './ucrx-setter.js';

export type UcrxCore = {
  readonly bol: UcrxSetter;
  readonly big: UcrxSetter;
  readonly ent: UcrxSetter;
  readonly nls: UcrxMethod<'reject'>;
  readonly nul: UcrxMethod<'reject'>;
  readonly num: UcrxSetter;
  readonly str: UcrxSetter;
  readonly for: UcrxMethod<'key' | 'reject'>;
  readonly map: UcrxMethod<'reject'>;
  readonly and: UcrxMethod<'reject'>;
  readonly end: UcrxMethod<'reject'>;
  readonly any: UcrxMethod<'value'>;
};

export const UcrxCore: UcrxCore = {
  bol: /*#__PURE__*/ new UcrxSetter({ key: 'bol', typeName: 'boolean' }),
  big: /*#__PURE__*/ new UcrxSetter({ key: 'big', typeName: 'bigint' }),
  ent: /*#__PURE__*/ new UcrxSetter({
    key: 'ent',
    stub({ value, reject }, _method, { lib }) {
      const UcEntity = lib.import(CHURI_MODULE, 'UcEntity');
      const ucrxRejectType = lib.import(CHURI_MODULE, 'ucrxRejectType');

      return `return this.any(new ${UcEntity}(${value})) || ${reject}(${ucrxRejectType}('entity', this));`;
    },
    typeName: 'entity',
  }),
  nls: /*#__PURE__*/ new UcrxMethod({
    key: 'nls',
    args: ['reject'],
    stub: UcrxCore$createStub('nested list'),
    typeName: 'nested list',
  }),
  nul: /*#__PURE__*/ new UcrxMethod({
    key: 'nul',
    args: ['reject'],
    typeName: 'null',
    stub({ reject }, _method, { lib }) {
      const ucrxRejectNull = lib.import(CHURI_MODULE, 'ucrxRejectNull');

      return `return this.any(null) || ${reject}(${ucrxRejectNull}(this));`;
    },
  }),
  num: /*#__PURE__*/ new UcrxSetter({ key: 'num', typeName: 'number' }),
  str: /*#__PURE__*/ new UcrxSetter({ key: 'str', typeName: 'string' }),
  for: /*#__PURE__*/ new UcrxMethod({
    key: 'for',
    args: ['key', 'reject'],
    stub({ reject }, _method, { lib }) {
      const ucrxRejectType = lib.import(CHURI_MODULE, 'ucrxRejectType');

      return `return ${reject}(${ucrxRejectType}('map', this));`;
    },
  }),
  map: /*#__PURE__*/ new UcrxMethod({
    key: 'map',
    args: ['reject'],
    stub({ reject }, _method, { lib }) {
      const ucrxRejectType = lib.import(CHURI_MODULE, 'ucrxRejectType');

      return `return ${reject}(${ucrxRejectType}('map', this));`;
    },
    typeName: 'map',
  }),
  and: /*#__PURE__*/ new UcrxMethod({
    key: 'and',
    args: ['reject'],
    stub({ reject }, _method, { lib }) {
      const ucrxRejectType = lib.import(CHURI_MODULE, 'ucrxRejectType');

      return `return ${reject}(${ucrxRejectType}('list', this));`;
    },
  }),
  end: /*#__PURE__*/ new UcrxMethod({
    key: 'end',
    args: ['reject'],
    stub: () => UccCode.none,
  }),
  any: /*#__PURE__*/ new UcrxMethod<'value'>({
    key: 'any',
    args: ['value'],
    stub: () => `return 0;`,
    typeName: 'any',
  }),
};

function UcrxCore$createStub(typeName: string): UcrxMethod.Body<'reject'> {
  return ({ reject }, _method, { lib }) => code => {
      const ucrxRejectType = lib.import(CHURI_MODULE, 'ucrxRejectType');

      code.write(`return ${reject}(${ucrxRejectType}(${jsStringLiteral(typeName)}, this));`);
    };
}
