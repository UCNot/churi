import { EsArg, EsSignature, EsSnippet, esImportClass } from 'esgen';
import { UcsWriter } from '../../serializer/ucs-writer.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsFunction } from './ucs-function.js';

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
  export type AllValues = {
    readonly [key in keyof Values]-?: Exclude<Values[key], undefined>;
  };
}

export const UcsWriterClass = esImportClass(
  UC_MODULE_SERIALIZER,
  UcsWriter.name,
  UcsWriterSignature,
);

export type CreateUcsWriterExpr = (
  this: void,
  args: UcsWriterSignature.AllValues,
  serializer: UcsFunction,
) => EsSnippet;
