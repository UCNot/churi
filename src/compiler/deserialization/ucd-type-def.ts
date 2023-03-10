import { UcSchema } from '../../schema/uc-schema.js';
import { UcdUcrx, UcdUcrxLocation } from './ucd-ucrx.js';

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
   * Generates initialization code of {@link @hatsy/churi!Ucrx charge receiver} properties.
   *
   * @param location - A location inside deserializer function to insert generated code into.
   *
   * @returns Per-property initializers, or `undefined` if the receiver can not be generated.
   */
  initRx(location: UcdUcrxLocation<T>): UcdUcrx | undefined;
}
