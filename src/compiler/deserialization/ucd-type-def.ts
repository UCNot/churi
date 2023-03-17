import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdLib } from './ucd-lib.js';

/**
 * Type deserialization definition.
 *
 * @typeParam T - Supported data type.
 * @typeParam TSchema - Charge schema type.
 */
export interface UcdTypeDef<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
  /**
   * Either deserialized type name, or type class.
   */
  readonly type: UcSchema<T>['type'];

  readonly entity?: undefined;
  readonly entityPrefix?: undefined;

  /**
   * Creates charge receiver template to use to deserialize target data type.
   *
   * @param lib - Deserializer library.
   * @param schema - Data schema instance.
   *
   * @returns Either receiver template, or `undefined` if the receiver can not be generated.
   */
  createTemplate(lib: UcdLib, schema: TSchema): UcrxTemplate<T, TSchema> | undefined;
}
