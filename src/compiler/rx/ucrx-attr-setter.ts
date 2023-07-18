import { EsArg, EsSignature } from 'esgen';
import { UcrxCore$stub } from '../impl/ucrx-core.stub.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxAttrSetter extends UcrxMethod<UcrxAttrSetterSignature.Args> {

  constructor(requestedName: string) {
    super(requestedName, {
      args: { attr: {}, cx: {} },
      stub: UcrxCore$stub,
    });
  }

}

export type UcrxAttrSetterSignature = EsSignature<UcrxAttrSetterSignature.Args>;

export namespace UcrxAttrSetterSignature {
  export type Args = {
    readonly attr: EsArg;
    readonly cx: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
}
