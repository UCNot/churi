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
  readonly lib: UcdLib;

  /**
   * Builds code that registers created entity receiver.
   *
   * @param entityRx - Entity receiver expression.
   *
   * @returns Source of entity registration code.
   */
  register(entityRx: string): UccSource;

  /**
   * Make entity handler depend on the given symbol.
   *
   * @param dep - Dependency symbol name.
   */
  handleWith(this: void, dep: string): void;
}
