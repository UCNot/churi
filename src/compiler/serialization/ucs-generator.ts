import { EsSnippet } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcsFunction } from './ucs-function.js';
import { UcsSignature } from './ucs.signature.js';

/**
 * Generates code for type instance serialization.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @param serializer - Enclosing serializer function. Not necessarily for the target value.
 * @param schema - Schema of serialized value.
 * @param args - Serializer argument values.
 *
 * @returns Serializer code snippet, or `undefined` if the value serializer can not be generated.
 */
export type UcsGenerator<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> = {
  serialize(fn: UcsFunction, schema: TSchema, args: UcsSignature.AllValues): EsSnippet | undefined;
}['serialize'];
