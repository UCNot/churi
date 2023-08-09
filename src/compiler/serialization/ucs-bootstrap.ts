import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccBootstrap } from '../bootstrap/ucc-bootstrap.js';
import { UccSchemaIndex } from '../bootstrap/ucc-schema-index.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsInsetWrapper } from './ucs-inset-formatter.js';
import { CreateUcsWriterExpr } from './ucs-writer.class.js';

/**
 * Schema {@link UcsCompiler serializer} bootstrap.
 */
export interface UcsBootstrap extends UccBootstrap<UcsBootstrap> {
  /**
   * Schema index used to uniquely identify schemas.
   */
  get schemaIndex(): UccSchemaIndex;

  /**
   * Assigns formatter or format to use for `target` value type or schema.
   *
   * Formatter provided for particular schema takes precedence over the one provided for the type.
   *
   * @typeParam T - Implied data type.
   * @param format - Name of target format.
   * @param target - Name or class of target value type, or target schema instance.
   * @param formatter - Assigned formatter.
   *
   * When omitted, the given `format` is assigned instead to {@link currentPresentation current inset}, given the
   * formatter for that `format` is assigned somewhere else.
   *
   * @returns `this` instance.
   */
  formatWith<T>(
    format: UcFormatName,
    target: UcSchema<T>['type'] | UcSchema<T>,
    formatter?: UcsFormatter<T>,
  ): this;

  /**
   * Modifies insets of the given format.
   *
   * @param hostFormat - Name of the format containing insets.
   * @param wrapper - Wrapper to apply to matching inset formatters.
   *
   * @returns `this` instance.
   */
  modifyInsets(hostFormat: UcFormatName, wrapper: UcsInsetWrapper): this;

  /**
   * Modifies inset of the given type.
   *
   * @typeParam T - Implied data type.
   * @param hostFormat - Name of target format.
   * @param host - Name or class of value type, or the schema instance containing insets.
   * @param wrapper - Wrapper to apply to matching inset formatters.
   *
   * @returns `this` instance.
   */
  modifyInsets<T>(
    hostFormat: UcFormatName,
    host: UcSchema<T>['type'] | UcSchema<T>,
    wrapper: UcsInsetWrapper,
  ): this;

  /**
   * Overrides {@link churi/serializer.js!UcsWriter UcsWriter} instantiation for the given `format`.
   *
   * @param format - Target format.
   * @param createWriter - Builds `UcsWriter` instantiation expression.
   *
   * @returns `this` instance.
   */
  writeWith(format: UcFormatName, createWriter: CreateUcsWriterExpr): this;
}
