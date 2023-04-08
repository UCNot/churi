import { UccSource } from '../codegen/ucc-code.js';
import { UcdLib } from './ucd-lib.js';

/**
 * Entity deserializer configuration signature.
 *
 * Generates code that creates {@link churi!EntityUcrx entity receiver}.
 *
 * Generated code expected to place created receiver instance between the given {@link UcdEntitySetup#prefix prefix}
 * and {@link UcdEntitySetup#suffix suffix}.
 *
 * @param setup - Entity deserialization setup.
 *
 * @returns Source of code that create entity receiver.
 */
export type UcdEntityConfig = (setup: UcdEntitySetup) => UccSource;

/**
 * Entity deserialization setup.
 */
export interface UcdEntitySetup {
  /**
   * Configured deserializer library.
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
