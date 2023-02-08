import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcdFunction } from './ucd-function.js';

/**
 * Type deserialization definition.
 *
 * @typeParam T - Supported data type.
 */
export interface UcdDef<out T = unknown> {
  /**
   * Either deserialized type name, or type class.
   */
  readonly type: UcSchema<T>['type'];

  /**
   * Generates code for type instance deserialization.
   *
   * @param deserializer - Enclosing deserializer function. Not necessarily for the target value.
   * @param schema - Schema of deserialized value.
   * @param setter - An expression resolved to deserialized value setter function.
   *
   * @returns Deserializer code source, or `undefined` if the value deserializer can not be generated.
   */
  deserialize(
    deserializer: UcdFunction,
    schema: UcSchema<T>,
    setter: string,
  ): UccCode.Source | undefined;
}
