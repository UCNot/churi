import { UccArgs } from '../codegen/ucc-args.js';

export type UcrxArgs = UccArgs<UcrxArgs.Arg>;

export namespace UcrxArgs {
  export type Spec = UccArgs.Spec<Arg>;
  export type Arg = 'set' | 'context';
  export type ByName = UccArgs.ByName<Arg>;
}
