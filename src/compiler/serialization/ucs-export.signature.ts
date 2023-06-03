import { EsArg, EsSignature } from 'esgen';

export const UcsExportSignature: UcsExportSignature = /*#__PURE__*/ new EsSignature({
  stream: {},
  value: {},
});

export type UcsExportSignature = EsSignature<UcsExportSignature.Args>;

export namespace UcsExportSignature {
  export type Args = {
    readonly stream: EsArg;
    readonly value: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
}
