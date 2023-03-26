import { arraysAreEqual } from '@proc7ts/primitives';
import { UccArgs } from '../codegen/ucc-args.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxSetter extends UcrxMethod<UcrxSetter.Arg> {

  constructor(options: UcrxSetter.Options) {
    const { stub = UcrxSetter$stub } = options;

    super({ ...options, args: UcrxSetter$args, stub });
  }

}

export namespace UcrxSetter {
  export type Arg = 'value';
  export interface Options extends Omit<UcrxMethod.Options<UcrxSetter.Arg>, 'args' | 'stub'> {
    readonly stub?: UcrxMethod.Body<'value'>;
  }
}

export function isUcrxSetter(method: UcrxMethod<any>): method is UcrxSetter {
  return arraysAreEqual(method.args.list, UcrxSetter$args.list);
}

const UcrxSetter$args = new UccArgs<UcrxSetter.Arg>('value');

function UcrxSetter$stub({ value }: UccArgs.ByName<UcrxSetter.Arg>): UccCode.Source {
  return `return this.set(${value});`;
}
