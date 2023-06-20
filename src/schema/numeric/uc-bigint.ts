import { asArray } from '@proc7ts/primitives';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * BigInt type alias used in {@link UcNumber.Schema schema} processing.
 */
export type UcBigInt = bigint;

export namespace UcBigInt {
  /**
   * Schema for {@link UcBigInt BigInt value}.
   *
   * BigInt schema is created automatically when [BigInt] constructor is used as model.
   *
   * When {@link Options additional options} needed, the schema has to be created {@link ucBigInt explicitly}.
   *
   * BigInt values may be represented with and without `0n` prefix. This differs from schema-less processing,
   * where `0n` prefix is required for BigInt values. When serializing, the `0n` prefix is either added or not
   * according to {@link Variant#number number processing policy}.
   *
   * [BigInt]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/BigInt/BigInt
   */
  export interface Schema extends UcSchema<UcBigInt> {
    /**
     * BigInt schema type always refers to standard [BigInt] constructor.
     *
     * [BigInt]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/BigInt/BigInt
     */
    readonly type: UcDataType<UcBigInt>;
  }

  /**
   * Variant of BigInt representation.
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

    /**
     * How to process number values.
     *
     * @defaultValue `'parse'`
     */
    readonly number?: NumberProcessing;
  }

  /**
   * Additional options for {@link ucBigInt BigInt schema}.
   */
  export interface Options extends UcSchema.Extension<UcBigInt, Schema>, Variant {}

  /**
   * String value processing policy.
   *
   * The input string may be parsed when BigInt expected by schema. The string processing policy controls this behavior.
   *
   * The policy is one of:
   *
   * - `'parse'` or `undefined` (the default) to parse the input string. If this fails, an error is reported. Note that
   *   strings containing BigInt values should not start with `0n` prefix.
   * - `'serialize'` is the same as `'parse'`, but also serializes BigInt values as strings.
   * - `'reject'` to reject the input string.
   */
  export type StringProcessing = 'parse' | 'serialize' | 'reject' | undefined;

  /**
   * Number value processing policy.
   *
   * The input number without `0n` prefix may be parsed as BigInt when expected by schema. The number processing policy
   * controls this behavior.
   *
   * The policy is one of:
   *
   * - `'parse'` or `undefined` (the default) to parse the input number without `0n` prefix as BigInt. If this fails,
   *   an error is reported.
   * - `'serialize'` is the same as `'parse'`, but also serializes BigInt values as numbers without `0n` prefix.
   * - `'auto'` is the same as `'serialize'` if the value can be represented as number, i.e. it is between
   *   [MIN_SAFE_INTEGER] and [MAX_SAFE_INTEGER]. Otherwise, a `0n` prefix is added.
   * - `'reject'` to reject the input numbers without `0n` prefix. This is the default behavior for schema-less
   *   processing, but not when BigInt expected by schema.
   *
   * [MIN_SAFE_INTEGER]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER
   * [MAX_SAFE_INTEGER]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
   */
  export type NumberProcessing = 'parse' | 'serialize' | 'auto' | 'reject' | undefined;
}

/**
 * Creates data schema for {@link UcBigInt bigint} values.
 *
 * @param options - Additional schema options.
 *
 * @returns BigInt data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucBigInt(options?: UcBigInt.Options): UcBigInt.Schema {
  if (options) {
    const { where, string, number } = options;
    const variant: UcBigInt.Variant | undefined = string || number ? { string, number } : undefined;

    return ucSchema<UcBigInt>(BigInt, {
      where: variant
        ? [
            {
              deserializer: {
                use: 'BigIntUcrxClass',
                from: COMPILER_MODULE,
                with: variant,
              },
              serializer: {
                use: 'ucsSupportBigInt',
                from: COMPILER_MODULE,
                with: variant,
              },
            },
            ...asArray(where),
          ]
        : where,
    });
  }

  return ucSchema<UcBigInt>(BigInt);
}
