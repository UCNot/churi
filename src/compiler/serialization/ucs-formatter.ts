import { EsArg, EsSignature, EsSnippet } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';

/**
 * Type formatter generates code for type instance formatting.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @param args - Serializer argument values.
 * @param schema - Schema of serialized value.
 * @param context - Formatter context.
 *
 * @returns Serializer code snippet, or `undefined` if the value serializer can not be generated.
 */
export type UcsFormatter<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> = {
  format(
    args: UcsFormatterSignature.AllValues,
    schema: TSchema,
    context: UcsFormatterContext,
  ): EsSnippet | undefined;
}['format'];

export interface UcsFormatterContext {
  format(
    schema: UcSchema,
    args: UcsFormatterSignature.AllValues,
    onUnknownSchema?: (schema: UcSchema, context: UcsFormatterContext) => never,
  ): EsSnippet;
  toString(): string;
}

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
