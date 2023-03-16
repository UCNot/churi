import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxLocation } from '../rx/ucrx-location.js';
import { UccCode } from '../ucc-code.js';

/**
 * Type deserialization definition.
 *
 * @typeParam T - Supported data type.
 */
export interface UcdTypeDef<out T = unknown> {
  /**
   * Either deserialized type name, or type class.
   */
  readonly type: UcSchema<T>['type'];

  readonly entity?: undefined;
  readonly entityPrefix?: undefined;

  /**
   * Generates data deserialization code.
   *
   * @param location - A location inside deserializer function to insert generated code into.
   *
   * @returns Deserialization code, or `undefined` if the receiver can not be generated.
   */
  deserialize(location: UcrxLocation<T>): UccCode.Source | undefined;
}
