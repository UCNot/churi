import { UcToken } from '../../syntax/uc-token.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
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
   * Custom methods required to present in {@link UcrxLib#voidUcrx void charge receiver template}.
   */
  readonly methods?: UcrxMethod<any> | readonly UcrxMethod<any>[] | undefined;

  /**
   * Generates code that creates {@link churi!EntityPrefixUcrx entity prefix receiver}.
   *
   * Generated code expected to place created receiver instance between the given
   * {@link UcdEntityDef.Location#prefix prefix} and {@link UcdEntityDef.Location#suffix suffix}.
   *
   * @param location - A location inside deserializer library to insert generated code into.
   *
   * @returns Source of code that create entity prefix receiver.
   */
  createRx(location: UcdEntityDef.Location): UccSource;
}
