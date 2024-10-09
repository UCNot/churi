import { EsArg, EsSignature } from 'esgen';
import { UcrxCore$stub } from './impl/ucrx-core.stub.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxEntitySetter extends UcrxMethod<UcrxEntitySetterSignature.Args> {
  constructor(requestedName: string) {
    super(requestedName, {
      args: { name: {}, cx: {} },
      stub: UcrxCore$stub,
    });
  }
}

export type UcrxEntitySetterSignature = EsSignature<UcrxEntitySetterSignature.Args>;

export namespace UcrxEntitySetterSignature {
  export type Args = {
    readonly name: EsArg;
    readonly cx: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
}
