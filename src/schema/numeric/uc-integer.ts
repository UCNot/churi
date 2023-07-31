import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcSchema, ucSchema } from '../uc-schema.js';
import { UcNumber } from './uc-number.js';

/**
 * Integer type alias used in {@link UcInteger.Schema schema} processing.
 *
 * Unlike {@link UcNumber}, a value of this type supposed to be an integer. This, among other things, means it has to be
 * finite value between [MIN_SAFE_INTEGER] and [MAX_SAFE_INTEGER].
 *
 * Integer values parsed by [parseInt()] function and serialized using [Number.toFixed(0)] call. Otherwise, they are
 * processed exactly as {@link UcNumber numbers}. It is the developers's responsibility to ensure the value of this type
 * is integer.
 *
 * [MIN_SAFE_INTEGER]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER
 * [MAX_SAFE_INTEGER]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
 * [parseInt()]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/parseInt
 * [Number.toFixed(0)]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
 */
export type UcInteger = number;

export namespace UcInteger {
  /**
   * Schema for {@link UcInteger integer value}.
   *
   * The schema is created by {@link ucInteger} function.
   */
  export interface Schema extends UcSchema<UcInteger> {
    /**
     * Integer schema type is always `integer`.
     */
    readonly type: 'integer';
  }

  /**
   * Variant of integer representation.
   *
   * Different variants may treat {@link UcNumber.Variant#string string} values differently.
   */
  export type Variant = UcNumber.Variant;

  /**
   * Additional options for {@link ucInteger integer schema}.
   */
  export interface Options extends UcSchema.Extension<UcInteger, Schema>, Variant {}
}

/**
 * Creates data schema for {@link UcInteger integer} values.
 *
 * @param options - Additional schema options.
 *
 * @returns Integer data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucInteger(options?: UcInteger.Options): UcInteger.Schema {
  if (options) {
    const { string } = options;
    const variant: UcNumber.Variant | undefined = string
      ? {
          string,
        }
      : undefined;

    return ucSchema<UcInteger, UcInteger.Schema>(UcInteger$createSchema(variant), options);
  }

  return UcInteger$schema;
}

function UcInteger$createSchema(variant?: UcNumber.Variant): UcInteger.Schema {
  return {
    type: 'integer',
    where: {
      deserializer: {
        use: 'IntegerUcrxClass',
        from: COMPILER_MODULE,
        with: variant,
      },
      serializer: {
        use: 'ucsProcessInteger',
        from: COMPILER_MODULE,
        with: variant,
      },
    },
  };
}

const UcInteger$schema = /*#__PURE__*/ UcInteger$createSchema();
