import { EsArg, EsSignature } from 'esgen';
import { UcrxCore$stub } from './impl/ucrx-core.stub.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxFormattedSetter extends UcrxMethod<UcrxFormattedSetterSignature.Args> {
  constructor(requestedName: string) {
    super(requestedName, {
      args: { format: {}, data: {}, cx: {} },
      stub: UcrxCore$stub,
    });
  }
}

export type UcrxFormattedSetterSignature = EsSignature<UcrxFormattedSetterSignature.Args>;

export namespace UcrxFormattedSetterSignature {
  export type Args = {
    readonly format: EsArg;
    readonly data: EsArg;
    readonly cx: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
}
