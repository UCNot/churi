import { UcrxMethod } from './ucrx-method.js';

export class UcrxSetter extends UcrxMethod<'value'> {

  constructor(options: UcrxSetter.Options) {
    super({ ...options, args: ['value'] });
  }

}

export namespace UcrxSetter {
  export type Options = Omit<UcrxMethod.Options<'value'>, 'args'>;
}
