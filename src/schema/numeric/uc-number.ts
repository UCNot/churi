import { asArray } from '@proc7ts/primitives';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * Number type alias used in {@link UcNumber.Schema schema} processing.
 */
export type UcNumber = number;

export namespace UcNumber {
  /**
   * Schema for {@link UcNumber number value}.
   *
   * Number schema is created automatically when [Number] constructor is used as model.
   *
   * When {@link Options additional options} needed, the schema has to be created {@link ucNumber explicitly}.
   *
   * [Number]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/Number
   */
  export interface Schema extends UcSchema<UcNumber> {
    /**
     * Number schema type always refers to standard [Number] constructor.
     *
     * [Number]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/Number
     */
    readonly type: UcDataType<UcNumber>;
  }

  /**
   * Variant of number representation.
   *
   * Different variants may treat {@link string} values differently.
   */
  export interface Variant {
    /**
     * How to process string values.
     *
     * @defaultValue `'parse'`
     */
    readonly string?: StringProcessing;
  }

  /**
   * Additional options for {@link ucNumber number schema}.
   */
  export interface Options extends UcSchema.Extension<UcNumber, Schema>, Variant {}

  /**
   * String value processing policy.
   *
   * The input string may be parsed when number expected by schema. The string processing policy controls this behavior.
   *
   * The policy is one of:
   *
   * - `'parse'` or `undefined` (the default) to parse the input string. If this fails, an error is reported.
   * - `'serialize'` is the same as `'parse'`, but also serializes numbers as strings. Note that in this case the
   *   `NaN`, `Infinity` and `-Infinity` values encoded as strings rather corresponding entities.
   * - `'reject'` to reject the input string.
   */
  export type StringProcessing = 'parse' | 'serialize' | 'reject' | undefined;
}

/**
 * Creates data schema for {@link UcNumber number} values.
 *
 * @param options - Additional schema options.
 *
 * @returns Number data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucNumber(options?: UcNumber.Options): UcNumber.Schema {
  if (options) {
    const { where, within, string } = options;
    const variant: UcNumber.Variant | undefined = string
      ? {
          string,
        }
      : undefined;

    return ucSchema<UcNumber>(Number, {
      where: variant
        ? [
            {
              deserializer: {
                use: 'NumberUcrxClass',
                from: COMPILER_MODULE,
                with: variant,
              },
              serializer: {
                use: 'ucsProcessNumber',
                from: COMPILER_MODULE,
                with: variant,
              },
            },
            ...asArray(where),
          ]
        : where,
      within,
    });
  }

  return ucSchema<UcNumber>(Number);
}
