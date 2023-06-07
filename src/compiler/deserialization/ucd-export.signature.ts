import { EsArg, EsSignature } from 'esgen';

export const UcdExportSignature: UcdExportSignature = /*#__PURE__*/ new EsSignature({
  input: {},
  'options?': {},
});

export type UcdExportSignature = EsSignature<UcdExportSignature.Args>;

export namespace UcdExportSignature {
  export type Args = {
    readonly input: EsArg;
    readonly ['options?']: EsArg;
  };

  export type Values = EsSignature.ValuesOf<Args>;

  export type AllValues = {
    readonly [key in keyof Values]-?: Exclude<Values[key], undefined>;
  };
}
