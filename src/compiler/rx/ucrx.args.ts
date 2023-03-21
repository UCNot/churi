import { UccArgs } from '../codegen/ucc-args.js';

export type UcrxArgs = UccArgs<UcrxArgs.Arg>;

export namespace UcrxArgs {
  export type Arg = 'set' | 'context';
  export type ByName = UccArgs.ByName<Arg>;
}

export const UcrxArgs: UcrxArgs = /*#__PURE__*/ new UccArgs('set', 'context');
