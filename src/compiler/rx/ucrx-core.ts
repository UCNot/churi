import { EsArg, EsCode, EsMethodDeclaration, esStringLiteral, esline } from 'esgen';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UcrxAttrSetter, UcrxAttrSetterSignature } from './ucrx-attr-setter.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxProperty } from './ucrx-property.js';
import { UcrxSetter } from './ucrx-setter.js';

export type UcrxCore = {
  readonly types: UcrxProperty;
  readonly att: UcrxMethod<UcrxAttrSetterSignature.Args>;
  readonly bol: UcrxSetter;
  readonly big: UcrxSetter;
  readonly ent: UcrxSetter;
  readonly nls: UcrxMethod<{ cx: EsArg }>;
  readonly nul: UcrxMethod<{ cx: EsArg }>;
  readonly num: UcrxSetter;
  readonly raw: UcrxSetter;
  readonly str: UcrxSetter;
  readonly for: UcrxMethod<{ key: EsArg; cx: EsArg }>;
  readonly map: UcrxMethod<{ cx: EsArg }>;
  readonly and: UcrxMethod<{ cx: EsArg }>;
  readonly end: UcrxMethod<{ cx: EsArg }>;
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
          args: { value, cx },
        },
      }) {
        const UcEntity = UC_MODULE_CHURI.import('UcEntity');
        const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

        return esline`return this.any(new ${UcEntity}(${value})) || ${cx}.reject(${ucrxRejectType}('entity', this));`;
      },
    },
    typeName: 'entity',
  }),
  nls: /*#__PURE__*/ new UcrxMethod('nls', {
    args: { cx: {} },
    stub: UcrxCore$rejectType('nested list'),
    typeName: 'nested list',
  }),
  nul: /*#__PURE__*/ new UcrxMethod('nul', {
    args: { cx: {} },
    stub: {
      body({
        member: {
          args: { cx },
        },
      }) {
        const ucrxRejectNull = UC_MODULE_CHURI.import('ucrxRejectNull');

        return esline`return this.any(null) || ${cx}.reject(${ucrxRejectNull}(this));`;
      },
    },
    typeName: 'null',
  }),
  num: /*#__PURE__*/ new UcrxSetter('num', { typeName: 'number' }),
  raw: /*#__PURE__*/ new UcrxSetter('raw', { typeName: 'string' }),
  str: /*#__PURE__*/ new UcrxSetter('str', { typeName: 'string' }),
  for: /*#__PURE__*/ new UcrxMethod('for', {
    args: { key: {}, cx: {} },
    stub: {
      body({
        member: {
          args: { cx },
        },
      }) {
        const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

        return esline`return ${cx}.reject(${ucrxRejectType}('map', this));`;
      },
    },
  }),
  map: /*#__PURE__*/ new UcrxMethod('map', {
    args: { cx: {} },
    stub: UcrxCore$rejectType('map'),
    typeName: 'map',
  }),
  and: /*#__PURE__*/ new UcrxMethod('and', {
    args: { cx: {} },
    stub: UcrxCore$rejectType('list'),
  }),
  end: /*#__PURE__*/ new UcrxMethod('end', {
    args: { cx: {} },
    stub: { body: () => EsCode.none },
  }),
  any: /*#__PURE__*/ new UcrxMethod('any', {
    args: { value: {} },
    stub: { body: () => `return 0;` },
    typeName: 'any',
  }),
};

function UcrxCore$rejectType(typeName: string): EsMethodDeclaration<{ cx: EsArg }> {
  return {
    body({
      member: {
        args: { cx },
      },
    }) {
      const ucrxRejectType = UC_MODULE_CHURI.import('ucrxRejectType');

      return esline`return ${cx}.reject(${ucrxRejectType}(${esStringLiteral(typeName)}, this));`;
    },
  };
}
