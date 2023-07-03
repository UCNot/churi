import { EsReference, EsSnippet } from 'esgen';

/**
 * Deserialization handler feature.
 *
 * Generates code that {@link UcdHandlerSetup#register registers} deserialization handlers, such as
 * {@link churi!EntityUcrx entity receiver}, {@link churi!FormatUcrx formatted data receiver},
 * or {@link churi!MetaUcrx metadata attribute receiver}.
 *
 * @param setup - Deserialization handler setup.
 *
 * @returns Code snippet containing handlers registration.
 */
export type UcdHandlerFeature = (setup: UcdHandlerSetup) => EsSnippet;

/**
 * Deserialization handler setup.
 *
 * Passed to {@link UcdHandlerFeature deserialization handler feature} when the latter enabled.
 */
export interface UcdHandlerSetup {
  /**
   * Builds code that registers created handler.
   *
   * @param handler - Default handler expression.
   *
   * @returns Code snippet containing default handler registration.
   */
  register(this: void, handler: EsSnippet): EsSnippet;

  /**
   * Makes registered handler refer the given symbol.
   *
   * The referenced symbol will be declared before the handler.
   *
   * @param ref - Referred symbol.
   */
  refer(this: void, ref: EsReference): void;
}
