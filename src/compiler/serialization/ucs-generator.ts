import { UcSchema } from '../../schema/uc-schema.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UcsFunction } from './ucs-function.js';

/**
 * Generates code for type instance serialization.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @param serializer - Enclosing serializer function. Not necessarily for the target value.
 * @param schema - Schema of serialized value.
 * @param value - An expression resolved to serialized value.
 * @param asItem - Whether the serialized value is a list item.
 *
 * @returns Serializer code source, or `undefined` if the value serializer can not be generated.
 */
export type UcsGenerator<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> = {
  serialize(
    serializer: UcsFunction,
    schema: TSchema,
    value: string,
    asItem: string,
  ): UccSource | undefined;
}['serialize'];
