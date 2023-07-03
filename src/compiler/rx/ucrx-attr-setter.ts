import { EsArg, EsCode, EsSignature } from 'esgen';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxAttrSetter extends UcrxMethod<UcrxAttrSetterSignature.Args> {

  constructor(requestedName: string) {
    super(requestedName, {
      args: { attr: {}, cx: {} },
      stub: {
        body: () => EsCode.none,
      },
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
