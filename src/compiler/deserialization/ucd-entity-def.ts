import { UcToken } from '../../syntax/uc-token.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcdLib } from './ucd-lib.js';

/**
 * Entity deserialization definition.
 */
export interface UcdEntityDef {
  readonly type?: undefined;

  /**
   * Matching entity.
   *
   * Either string or array of entity tokens.
   */
  readonly entity: string | readonly UcToken[];

  readonly entityPrefix?: undefined;

  /**
   * Generates code that registers entity handler.
   *
   * Generated code expected to contain an {@link @hatsy/churi/deserializer!UcdEntityHandler entity handler} instance
   * placed between the given {@link UcdEntityDef.Location#prefix prefix} and {@link UcdEntityDef.Location#suffix
   * suffix}.
   *
   * @param location - A location inside deserializer library to insert generated code into.
   *
   * @returns Source of code that registers entity handler.
   */
  addHandler(location: UcdEntityDef.Location): UccCode.Source;
}

export namespace UcdEntityDef {
  /**
   * A location inside deserializer library to insert generated code into.
   */
  export interface Location {
    /**
     * Enclosing deserializer library.
     */
    readonly lib: UcdLib;

    /**
     * Generated code prefix.
     *
     * Generated entity handler expression expected to be placed right after this prefix.
     *
     * This may be e.g. a method call with leading parameters.
     */
    readonly prefix: string;

    /**
     * Generated code suffix.
     *
     * Generated entity handler expression expected to be placed right before this suffix.
     *
     * This may be e.g. a closing parenthesis of method call.
     */
    readonly suffix: string;
  }
}
