import { arraysAreEqual } from '@proc7ts/primitives';
import { jsStringLiteral } from 'httongue';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { UccArgs } from '../codegen/ucc-args.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxSetter extends UcrxMethod<UcrxSetter.Arg> {

  constructor(options: UcrxSetter.Options) {
    const { stub = UcrxSetter$createStub(options.typeName) } = options;

    super({ ...options, args: UcrxSetter$args, stub });
  }

}

export namespace UcrxSetter {
  export type Arg = 'value' | 'reject';
  export interface Options extends Omit<UcrxMethod.Options<UcrxSetter.Arg>, 'args' | 'stub'> {
    readonly typeName: string;
    readonly stub?: UcrxMethod.Body<Arg>;
  }
}

export function isUcrxSetter(method: UcrxMethod<any>): method is UcrxSetter {
  return arraysAreEqual(method.args.list, UcrxSetter$args.list);
}

const UcrxSetter$args = new UccArgs<UcrxSetter.Arg>('value', 'reject');

function UcrxSetter$createStub(typeName: string): UcrxMethod.Body<UcrxSetter.Arg> {
  return ({ value, reject }, _method, { lib }) => code => {
      const ucrxRejectType = lib.import(CHURI_MODULE, 'ucrxRejectType');

      code.write(
        `return this.any(${value}) || ${reject}(${ucrxRejectType}(${jsStringLiteral(
          typeName,
        )}, this));`,
      );
    };
}
