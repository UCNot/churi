import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcsFunction } from './ucs-function.js';

/**
 * Type serialization definition.
 *
 * @typeParam T - Supported data type.
 */
export interface UcsDef<out T = unknown> {
  /**
   * Either serialized type name, or type class.
   */
  readonly type: UcSchema<T>['type'];

  /**
   * Generates code for type instance serialization.
   *
   * @param serializer - Enclosing serializer function. Not necessarily for the target value.
   * @param schema - Schema of serialized value.
   * @param value - An expression resolved to serialized value.
   * @param asItem - Whether the serialized value is a list item.
   *
   * @returns Serializer code source, or `undefined` if the value serializer can not be generated.
   */
  serialize(
    serializer: UcsFunction,
    schema: UcSchema<T>,
    value: string,
    asItem: string,
  ): UccCode.Source | undefined;
}
