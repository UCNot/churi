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
   * Generated code expected to contain an {@link UcdRx deserialized value receiver} placed between the given
   * {@link UcdDef.Location#prefix prefix} and {@link UcdDef.Location#suffix suffix}.
   *
   * @param schema - Schema of deserialized value.
   * @param location - A location inside deserializer function to insert generated code into.
   *
   * @returns Deserializer code source, or `undefined` if the value deserializer can not be generated.
   */
  deserialize(schema: UcSchema<T>, location: UcdDef.Location): UccCode.Source | undefined;
}

export namespace UcdDef {
  /**
   * A location inside deserializer function to insert generated code into.
   */
  export interface Location {
    /**
     * Enclosing deserializer function. Not necessarily for the target value.
     */
    readonly fn: UcdFunction;

    /**
     * An expression resolved to deserialized value setter function.
     */
    readonly setter: string;

    /**
     * Generated code prefix.
     *
     * Generated {@link UcdRx receiver} expression expected to be placed right after this prefix.
     *
     * This may be e.g. a {@link UcdReader#read function call}.
     */
    readonly prefix: string;

    /**
     * Generated code suffix.
     *
     * Generated {@link UcdRx receiver} expression expected to be placed right before this suffix.
     *
     * This may be e.g. a closing parenthesis for function call.
     */
    readonly suffix: string;
  }
}
