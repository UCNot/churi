import { EsReference, EsSnippet } from 'esgen';
import { UcdLib } from './ucd-lib.js';

/**
 * Deserialization defaults feature.
 *
 * Generates code that {@link UcdDefaultsSetup#register registers} default deserialization handlers, such as
 * {@link churi!EntityUcrx entity receiver}, {@link churi!FormatUcrx formatted data receiver},
 * or {@link churi!MetaUcrx metadata attribute receiver}.
 *
 * @param setup - Deserialization defaults setup.
 *
 * @returns Code snippet containing defaults registration.
 */
export type UcdDefaultsFeature = (setup: UcdDefaultsSetup) => EsSnippet;

/**
 * Deserialization defaults setup.
 *
 * Passed to {@link UcdDefaultsFeature deserialization defaults feature} when the latter enabled.
 */
export interface UcdDefaultsSetup {
  /**
   * Configured deserializer library.
   */
  readonly lib: UcdLib.Any;

  /**
   * Builds code that registers created defaults.
   *
   * @param handler - Default handler expression.
   *
   * @returns Code snippet containing default handler registration.
   */
  register(this: void, handler: EsSnippet): EsSnippet;

  /**
   * Makes the default handler refer the given symbol.
   *
   * The referenced symbol will be declared before the handler.
   *
   * @param ref - Referred symbol.
   */
  refer(this: void, ref: EsReference): void;
}
