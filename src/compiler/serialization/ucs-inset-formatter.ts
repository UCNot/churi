import { UcFormatName, UcInsetName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcsFormatter } from './ucs-formatter.js';

/**
 * Inset formatter generates code for type instance formatting.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 */
export interface UcsInsetFormatter<out T, out TSchema extends UcSchema<T> = UcSchema<T>> {
  /**
   * Inset format name.
   */
  readonly insetFormat: UcFormatName;

  /**
   * Formats inset.
   */
  readonly format: UcsFormatter<T, TSchema>;
}

/**
 * Wrapper for inset formatters.
 *
 * Creates inset formatters based on the wrapped ones. May also create a default formatter for insets without
 * pre-configured formatters.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @param context - Inset formatting context.
 *
 * @returns Either inset formatter, or nothing for unexpected inset.
 */
export type UcsInsetWrapper = {
  wrapInsetFormatter<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>>(
    this: void,
    context: UcsInsetContext<T, TSchema>,
  ): UcsInsetFormatter<T, TSchema> | undefined;
}['wrapInsetFormatter'];

/**
 * Inset formatting context.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 */
export interface UcsInsetContext<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
  /**
   * The name of the host format containing the inset.
   */
  readonly hostFormat: UcFormatName;

  /**
   * Schema of the value containing the inset.
   */
  readonly hostSchema: UcSchema;

  /**
   * The name of the target inset.
   */
  readonly insetName: UcInsetName;

  /**
   * Inset value schema;
   */
  readonly schema: TSchema;

  /**
   * The inset formatter to wrap, if any.
   */
  readonly formatter?: UcsInsetFormatter<T, TSchema> | undefined;
}
