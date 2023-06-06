import { EsReference, EsSnippet } from 'esgen';
import { UcdLib } from './ucd-lib.js';

/**
 * Entity deserialization support feature.
 *
 * Generates code that {@link UcdEntitySetup#register registers} {@link churi!EntityUcrx entity receiver}.
 *
 * @param setup - Entity deserialization setup.
 *
 * @returns Code snippet containing entity registration.
 */
export type UcdEntityFeature = (setup: UcdEntitySetup) => EsSnippet;

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
   * @returns Code snippet containing entity registration.
   */
  register(this: void, entityRx: EsSnippet): EsSnippet;

  /**
   * Makes entity handler refer the given symbol.
   *
   * The referenced symbol will be declared before the entity handler.
   *
   * @param ref - Referred symbol.
   */
  refer(this: void, ref: EsReference): void;
}
