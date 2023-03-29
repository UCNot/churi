import { UcToken } from '../../syntax/uc-token.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
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
   * Custom methods required to present in {@link UcrxLib#voidUcrx void charge receiver template}.
   */
  readonly methods?: UcrxMethod<any> | readonly UcrxMethod<any>[] | undefined;

  /**
   * Generates code that creates {@link @hatsy/churi!EntityUcrx entity receiver}.
   *
   * Generated code expected to place created receiver instance between the given
   * {@link UcdEntityDef.Location#prefix prefix} and {@link UcdEntityDef.Location#suffix suffix}.
   *
   * @param location - A location inside deserializer library to insert generated code into.
   *
   * @returns Source of code that create entity receiver.
   */
  createRx(location: UcdEntityDef.Location): UccSource;
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
     * Generated entity receiver expression expected to be placed right after this prefix.
     *
     * This may be e.g. a method call with leading parameters.
     */
    readonly prefix: string;

    /**
     * Generated code suffix.
     *
     * Generated entity receiver expression expected to be placed right before this suffix.
     *
     * This may be e.g. a closing parenthesis of method call.
     */
    readonly suffix: string;
  }
}
