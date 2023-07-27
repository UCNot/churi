import { EsArg, EsSignature, EsSnippet } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcsFunction } from './ucs-function.js';

/**
 * Type formatter generates code for type instance formatting.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @param args - Serializer argument values.
 * @param schema - Schema of serialized value.
 * @param fn - Enclosing serializer function. Not necessarily for the target value.
 *
 * @returns Serializer code snippet, or `undefined` if the value serializer can not be generated.
 */
export type UcsFormatter<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> = {
  format(
    args: UcsFormatterSignature.AllValues,
    schema: TSchema,
    fn: UcsFunction,
  ): EsSnippet | undefined;
}['format'];

export const UcsFormatterSignature: UcsFormatterSignature = /*#__PURE__*/ new EsSignature({
  writer: {},
  value: {},
  'asItem?': {},
});

export type UcsFormatterSignature = EsSignature<UcsFormatterSignature.Args>;

export namespace UcsFormatterSignature {
  export type Args = {
    readonly writer: EsArg;
    readonly value: EsArg;
    readonly ['asItem?']: EsArg;
  };
  export type Values = EsSignature.ValuesOf<Args>;
  export type AllValues = { readonly [key in keyof Values]-?: Exclude<Values[key], undefined> };
}
