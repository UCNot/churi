import { EsArg, EsSignature, esImportClass } from 'esgen';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';

export type UcsWriterSignature = EsSignature<UcsWriterSignature.Args>;

export const UcsWriterSignature: UcsWriterSignature = /*#__PURE__*/ new EsSignature({
  stream: {},
  'options?': {},
});

export namespace UcsWriterSignature {
  export type Args = {
    readonly stream: EsArg;
    readonly ['options?']: EsArg;
  };

  export type Values = EsSignature.ValuesOf<Args>;
}

export const UcsWriterClass = esImportClass(UC_MODULE_SERIALIZER, 'UcsWriter', UcsWriterSignature);
