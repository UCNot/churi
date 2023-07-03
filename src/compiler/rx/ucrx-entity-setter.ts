import { EsArg, EsSignature, esline } from 'esgen';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxEntitySetter extends UcrxMethod<UcrxEntitySetterSignature.Args> {

  constructor(requestedName: string) {
    super(requestedName, {
      args: { name: {}, cx: {} },
      stub: {
        body({
          member: {
            args: { name, cx },
          },
        }) {
          const UcEntity = UC_MODULE_CHURI.import('UcEntity');
          const ucrxRejectEntity = UC_MODULE_CHURI.import('ucrxRejectEntity');

          return code => {
            code.line(
              'return this.any(',
              esline`new ${UcEntity}(${name})`,
              ') || ',
              esline`${cx}.reject(${ucrxRejectEntity}(${name}));`,
            );
          };
        },
      },
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
