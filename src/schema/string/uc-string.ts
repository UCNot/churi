import { asArray } from '@proc7ts/primitives';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * String type alias used in {@link UcString.Schema schema} processing.
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
     * How to process raw values.
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
   * Raw value processing policy.
   *
   * Raw value may contain numeric value, `null` (`--`), or `false` (`-`). Without schema such value parsed accordingly
   * to its syntax. Raw value processing policy may change this.
   *
   * The policy is one of:
   *
   * - `'escape'` or `undefined` (the default) to treat raw value as string, and escape output to avoid ambiguity.
   *   I.e. string like `123` will be serialized as `'123`.
   * - `'asString'` to treat raw value as string, and do not escape the output when possible.
   *   I.e. a string like `123` will be serialized as is.
   * - `'parse'` to parse raw value according to its syntax. This is the default behavior for schema-less processing,
   *   but not when string value expected by schema.
   *
   * Note that if the value is {@link UcSchema#nullable nullable}, the `--` input is always treated as `null`.
   */
  export type RawProcessing = 'escape' | 'asString' | 'parse' | undefined;
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
    const { where, within, raw } = options;
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
                use: 'ucsProcessString',
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

  return ucSchema<UcString>(String);
}
