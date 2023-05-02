import { UccSource } from '../codegen/ucc-code.js';
import { UcdLib } from './ucd-lib.js';

/**
 * Entity deserialization support feature.
 *
 * Generates code that {@link UcdEntitySetup#register registers} {@link churi!EntityUcrx entity receiver}.
 *
 * @param setup - Entity deserialization setup.
 *
 * @returns Source of entity registration code.
 */
export type UcdEntityFeature = (setup: UcdEntitySetup) => UccSource;

/**
 * Entity deserialization setup.
 *
 * Passed to {@link UcdEntityFeature entity deserialization support feature} when the latter enabled.
 */
export interface UcdEntitySetup {
  /**
   * Configured deserializer library.
   */
  readonly lib: UcdLib.Any;

  /**
   * Builds code that registers created entity receiver.
   *
   * @param entityRx - Entity receiver expression.
   *
   * @returns Source of entity registration code.
   */
  register(entityRx: UccSource): UccSource;

  /**
   * Makes entity handler refer the given symbol.
   *
   * The referenced symbol will be declared before the entity handler.
   *
   * @param ref - Referenced symbol name.
   */
  refer(this: void, ref: string): void;
}
