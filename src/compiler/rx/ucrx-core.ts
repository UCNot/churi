import { UcrxMethod } from './ucrx-method.js';
import { UcrxSetter } from './ucrx-setter.js';

export interface UcrxCore {
  readonly bol: UcrxSetter;
  readonly big: UcrxSetter;
  readonly nls: UcrxMethod<''>;
  readonly num: UcrxSetter;
  readonly str: UcrxSetter;
  readonly for: UcrxMethod<'key'>;
  readonly map: UcrxMethod<''>;
  readonly em: UcrxMethod<''>;
  readonly ls: UcrxMethod<''>;
  readonly any: UcrxSetter;
  readonly nul: UcrxMethod<''>;
}

export const UcrxCore: UcrxCore = {
  bol: /*#__PURE__*/ new UcrxSetter({ key: 'bol', typeName: 'boolean' }),
  big: /*#__PURE__*/ new UcrxSetter({ key: 'big', typeName: 'bigint' }),
  nls: /*#__PURE__*/ new UcrxMethod<''>({
    key: 'nls',
    args: [],
    typeName: 'nested list',
  }),
  num: /*#__PURE__*/ new UcrxSetter({ key: 'num', typeName: 'number' }),
  str: /*#__PURE__*/ new UcrxSetter({ key: 'str', typeName: 'string' }),
  for: /*#__PURE__*/ new UcrxMethod({ key: 'for', args: ['key'] }),
  map: /*#__PURE__*/ new UcrxMethod<''>({ key: 'for', args: [], typeName: 'map' }),
  em: /*#__PURE__*/ new UcrxMethod<''>({ key: 'em', args: [] }),
  ls: /*#__PURE__*/ new UcrxMethod<''>({ key: 'ls', args: [] }),
  any: /*#__PURE__*/ new UcrxSetter({ key: 'any', typeName: 'any' }),
  nul: /*#__PURE__*/ new UcrxMethod<''>({ key: 'nul', args: [], typeName: 'null' }),
};
