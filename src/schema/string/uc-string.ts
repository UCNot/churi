import { asArray } from '@proc7ts/primitives';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * String value type alias used for {@link UcString.Schema schema} processing.
 */
export type UcString = string;

export namespace UcString {
  /**
   * Schema for {@link UcString string value}.
   *
   * String schema is created automatically when [String] constructor is used as model.
   *
   * When {@link Options additional options} needed, the schema has to be created {@link ucString explicitly}.
   *
   * [String]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/String
   */
  export interface Schema extends UcSchema<UcString> {
    /**
     * String schema type always refers to standard [String] constructor.
     *
     * [String]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/String
     */
    readonly type: UcDataType<UcString>;
  }

  /**
   * Variant of string representation.
   *
   * Different variants may treat the {@link raw} strings differently.
   */
  export interface Variant {
    /**
     * How to process raw strings.
     *
     * @defaultValue `'escape'`
     */
    readonly raw?: RawProcessing;
  }

  /**
   * Additional options for {@link ucString string schema}.
   */
  export interface Options extends UcSchema.Extension<UcString, Schema>, Variant {}

  /**
   * Raw strings processing policy.
   *
   * Raw strings may contain numeric values, `null` value (`--`), or `false` value (`-`). Without schema such strings
   * are treated accordingly to their syntax. Raw string processing policy may change this.
   *
   * The policy is one of:
   *
   * - `'escape'` or `undefined` (the default) to always treat input raw strings as string values, and escape output
   *   to avoid ambiguity. I.e. string like `123` will be serialized as `'123`.
   * - `'accept'` to always treat raw strings as string values, and do not escape the.
   *   I.e. a string like `123` will be serialized as is.
   * - `'prohibit'` to never try to process numeric values, `null`, or booleans as strings. This is the default policy
   *   for schema-less processing, but not when string value expected by schema.
   *
   * Note that if the value is {@link UcSchema#nullable nullable}, the `--` input is always treated as `null`.
   */
  export type RawProcessing = 'accept' | 'escape' | 'prohibit' | undefined;
}

/**
 * Creates data schema for {@link UcString string} values.
 *
 * @param options - Additional schema options.
 *
 * @returns String data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucString(options?: UcString.Options): UcString.Schema {
  if (options) {
    const { where, raw } = options;
    const variant: UcString.Variant | undefined = raw
      ? {
          raw,
        }
      : undefined;

    return ucSchema<UcString>(String, {
      where: variant
        ? [
            {
              deserializer: {
                use: 'StringUcrxClass',
                from: COMPILER_MODULE,
                with: variant,
              },
              serializer: {
                use: 'ucsSupportString',
                from: COMPILER_MODULE,
                with: variant,
              },
            },
            ...asArray(where),
          ]
        : where,
    });
  }

  return ucSchema<UcString>(String);
}
