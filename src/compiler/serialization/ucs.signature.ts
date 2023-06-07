import { EsArg, EsSignature } from 'esgen';

export const UcsSignature: UcsSignature = /*#__PURE__*/ new EsSignature({
  writer: {},
  value: {},
  'asItem?': {},
});

export type UcsSignature = EsSignature<UcsSignature.Args>;

export namespace UcsSignature {
  export type Args = {
    readonly writer: EsArg;
    readonly value: EsArg;
    readonly ['asItem?']: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
  export type AllValues = { readonly [key in keyof Values]-?: Exclude<Values[key], undefined> };
}
