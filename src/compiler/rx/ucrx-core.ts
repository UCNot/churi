import { EsArg } from 'esgen';
import { UcrxCore$stub, UcrxCore$stubBody } from '../impl/ucrx-core.stub.js';
import { UcrxAttrSetter, UcrxAttrSetterSignature } from './ucrx-attr-setter.js';
import { UcrxEntitySetter } from './ucrx-entity-setter.js';
import { UcrxFormattedSetter } from './ucrx-formatted-setter.js';
import { UcrxInsetMethod } from './ucrx-inset-method.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxProperty } from './ucrx-property.js';
import { UcrxSetter } from './ucrx-setter.js';

export type UcrxCore = {
  readonly types: UcrxProperty;
  readonly att: UcrxMethod<UcrxAttrSetterSignature.Args>;
  readonly bol: UcrxSetter;
  readonly big: UcrxSetter;
  readonly ent: UcrxEntitySetter;
  readonly fmt: UcrxFormattedSetter;
  readonly ins: UcrxInsetMethod;
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
      get: UcrxCore$stubBody,
    },
  }),
  att: /*#__PURE__*/ new UcrxAttrSetter('att'),
  bol: /*#__PURE__*/ new UcrxSetter('bol', { typeName: 'boolean', stub: UcrxCore$stub }),
  big: /*#__PURE__*/ new UcrxSetter('big', { typeName: 'bigint', stub: UcrxCore$stub }),
  ent: /*#__PURE__*/ new UcrxEntitySetter('ent'),
  fmt: /*#__PURE__*/ new UcrxFormattedSetter('fmt'),
  ins: /*#__PURE__*/ new UcrxInsetMethod('ins'),
  nls: /*#__PURE__*/ new UcrxMethod<{ cx: EsArg }>('nls', {
    args: { cx: {} },
    stub: UcrxCore$stub,
    typeName: 'nested list',
  }),
  nul: /*#__PURE__*/ new UcrxMethod('nul', {
    args: { cx: {} },
    stub: UcrxCore$stub,
    typeName: 'null',
  }),
  num: /*#__PURE__*/ new UcrxSetter('num', { typeName: 'number' }),
  raw: /*#__PURE__*/ new UcrxSetter('raw', { typeName: 'string' }),
  str: /*#__PURE__*/ new UcrxSetter('str', { typeName: 'string' }),
  for: /*#__PURE__*/ new UcrxMethod('for', {
    args: { key: {}, cx: {} },
    stub: UcrxCore$stub,
  }),
  map: /*#__PURE__*/ new UcrxMethod('map', {
    args: { cx: {} },
    stub: UcrxCore$stub,
    typeName: 'map',
  }),
  and: /*#__PURE__*/ new UcrxMethod('and', {
    args: { cx: {} },
    stub: UcrxCore$stub,
  }),
  end: /*#__PURE__*/ new UcrxMethod('end', {
    args: { cx: {} },
    stub: UcrxCore$stub,
  }),
  any: /*#__PURE__*/ new UcrxMethod('any', {
    args: { value: {} },
    stub: UcrxCore$stub,
    typeName: 'any',
  }),
};
