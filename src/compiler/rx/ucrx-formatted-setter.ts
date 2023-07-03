import { EsArg, EsSignature, esline } from 'esgen';
import { UC_MODULE_CHURI } from '../impl/uc-modules.js';
import { UcrxMethod } from './ucrx-method.js';

export class UcrxFormattedSetter extends UcrxMethod<UcrxFormattedSetterSignature.Args> {

  constructor(requestedName: string) {
    super(requestedName, {
      args: { format: {}, data: {}, cx: {} },
      stub: {
        body({
          member: {
            args: { format, data, cx },
          },
        }) {
          const UcFormatted = UC_MODULE_CHURI.import('UcFormatted');
          const ucrxRejectFormat = UC_MODULE_CHURI.import('ucrxRejectFormat');

          return code => {
            code.line(
              `return this.any(`,
              esline`new ${UcFormatted}(${format}, ${data})`,
              `) || `,
              esline`${cx}.reject(${ucrxRejectFormat}(${format}, ${data}));`,
            );
          };
        },
      },
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
