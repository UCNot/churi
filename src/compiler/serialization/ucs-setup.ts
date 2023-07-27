import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccSetup } from '../processor/ucc-setup.js';
import { UcsFormatter } from './ucs-formatter.js';

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
   * @typeParam format - Name of target format.
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
}
