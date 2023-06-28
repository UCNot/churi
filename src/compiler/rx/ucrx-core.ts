import { EsArg, EsCode, EsMethodDeclaration, esStringLiteral, esline } from 'esgen';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UcrxAttrSetter } from './ucrx-attr-setter.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxProperty } from './ucrx-property.js';
import { UcrxSetter } from './ucrx-setter.js';

export type UcrxCore = {
  readonly types: UcrxProperty;
  readonly att: UcrxMethod<{ attr: EsArg; reject: EsArg }>;
  readonly bol: UcrxSetter;
  readonly big: UcrxSetter;
  readonly ent: UcrxSetter;
  readonly nls: UcrxMethod<{ reject: EsArg }>;
  readonly nul: UcrxMethod<{ reject: EsArg }>;
  readonly num: UcrxSetter;
  readonly raw: UcrxSetter;
  readonly str: UcrxSetter;
  readonly for: UcrxMethod<{ key: EsArg; reject: EsArg }>;
  readonly map: UcrxMethod<{ reject: EsArg }>;
  readonly and: UcrxMethod<{ reject: EsArg }>;
  readonly end: UcrxMethod<{ reject: EsArg }>;
  readonly any: UcrxMethod<{ value: EsArg }>;
};

export const UcrxCore: UcrxCore = {
  types: /*#__PURE__*/ new UcrxProperty('types', {
    stub: {
      get: () => `return ['void'];`,
    },
  }),
  att: /*#__PURE__*/ new UcrxAttrSetter('att'),
  bol: /*#__PURE__*/ new UcrxSetter('bol', { typeName: 'boolean' }),
  big: /*#__PURE__*/ new UcrxSetter('big', { typeName: 'bigint' }),
  ent: /*#__PURE__*/ new UcrxSetter('ent', {
    stub: {
      body({
        member: {
          args: { value, reject },
        },
      }) {
        const UcEntity = UC_MODULE_CHURI.import('UcEntity');
        const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

        return esline`return this.any(new ${UcEntity}(${value})) || ${reject}(${ucrxRejectType}('entity', this));`;
      },
    },
    typeName: 'entity',
  }),
  nls: /*#__PURE__*/ new UcrxMethod('nls', {
    args: { reject: {} },
    stub: UcrxCore$rejectType('nested list'),
    typeName: 'nested list',
  }),
  nul: /*#__PURE__*/ new UcrxMethod('nul', {
    args: { reject: {} },
    stub: {
      body({
        member: {
          args: { reject },
        },
      }) {
        const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

        return esline`return this.any(null) || ${reject}(${ucrxRejectNull}(this));`;
      },
    },
    typeName: 'null',
  }),
  num: /*#__PURE__*/ new UcrxSetter('num', { typeName: 'number' }),
  raw: /*#__PURE__*/ new UcrxSetter('raw', { typeName: 'string' }),
  str: /*#__PURE__*/ new UcrxSetter('str', { typeName: 'string' }),
  for: /*#__PURE__*/ new UcrxMethod('for', {
    args: { key: {}, reject: {} },
    stub: {
      body({
        member: {
          args: { reject },
        },
      }) {
        const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

        return esline`return ${reject}(${ucrxRejectType}('map', this));`;
      },
    },
  }),
  map: /*#__PURE__*/ new UcrxMethod('map', {
    args: { reject: {} },
    stub: UcrxCore$rejectType('map'),
    typeName: 'map',
  }),
  and: /*#__PURE__*/ new UcrxMethod('and', {
    args: { reject: {} },
    stub: UcrxCore$rejectType('list'),
  }),
  end: /*#__PURE__*/ new UcrxMethod('end', {
    args: { reject: {} },
    stub: { body: () => EsCode.none },
  }),
  any: /*#__PURE__*/ new UcrxMethod('any', {
    args: { value: {} },
    stub: { body: () => `return 0;` },
    typeName: 'any',
  }),
};

function UcrxCore$rejectType(typeName: string): EsMethodDeclaration<{ reject: EsArg }> {
  return {
    body({
      member: {
        args: { reject },
      },
    }) {
      const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

      return esline`return ${reject}(${ucrxRejectType}(${esStringLiteral(typeName)}, this));`;
    },
  };
}
