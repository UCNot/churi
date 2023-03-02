import { UcToken } from '../../syntax/uc-token.js';
import { UccCode } from '../ucc-code.js';
import { UcdEntityDef } from './ucd-entity-def.js';

/**
 * Entity prefix deserialization definition.
 */
export interface UcdEntityPrefixDef {
  readonly type?: undefined;
  readonly entity?: undefined;

  /**
   * Matching entity prefix.
   *
   * Either string or array of entity tokens.
   */
  readonly entityPrefix: string | readonly UcToken[];

  /**
   * Generates code that registers entity prefix handler.
   *
   * Generated code expected to contain an {@link @hatsy/churi/deserializer!UcdEntityPrefixHandler entity prefix
   * handler} instance placed between the given {@link UcdEntityDef.Location#prefix prefix} and
   * {@link UcdEntityDef.Location#suffix suffix}.
   *
   * @param location - A location inside deserializer library to insert generated code into.
   *
   * @returns Source of code that registers entity prefix handler.
   */
  addHandler(location: UcdEntityDef.Location): UccCode.Source;
}
