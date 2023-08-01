import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccSetup } from '../processor/ucc-setup.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsInsetWrapper } from './ucs-inset-formatter.js';

/**
 * Schema {@link UcsCompiler serializer} setup.
 */
export interface UcsSetup extends UccSetup<UcsSetup> {
  /**
   * Assigns formatter to use for `target` value type or schema.
   *
   * Formatter provided for particular schema takes precedence over the one provided for the type.
   *
   * @typeParam T - Implied data type.
   * @param format - Name of target format.
   * @param target - Name or class of target value type, or target schema instance.
   * @param formatter - Assigned formatter.
   *
   * @returns `this` instance.
   */
  formatWith<T>(
    format: UcFormatName,
    target: UcSchema<T>['type'] | UcSchema<T>,
    formatter: UcsFormatter<T>,
  ): this;

  /**
   * Modifies inset formatters for the given `format`.
   *
   * @param format - Name of target format.
   * @param wrapper - Wrapper to apply to matching inset formatters.
   */
  modifyInsets(format: UcFormatName, wrapper: UcsInsetWrapper): this;

  /**
   * Modifies inset formatters for the given type.
   *
   * @typeParam T - Implied data type.
   * @param format - Name of target format.
   * @param target - Name or class of target value type, or target schema instance.
   * @param wrapper - Wrapper to apply to matching inset formatters.
   */
  modifyInsets<T>(
    format: UcFormatName,
    target: UcSchema<T>['type'] | UcSchema<T>,
    wrapper: UcsInsetWrapper,
  ): this;
}
