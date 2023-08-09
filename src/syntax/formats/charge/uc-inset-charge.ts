import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-process-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables{@link UcChargeLexer URI Charge Notation} format for schema or inset.
 *
 * @param options - Formatting options.
 *
 * @returns Schema constraints.
 */
export function ucFormatCharge(options?: UcChargeOptions): UcOmniConstraints;

export function ucFormatCharge({ plusAsSpace }: UcChargeOptions = {}): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdProcessInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcChargeLexer',
        from: CHURI_MODULE,
        method: plusAsSpace ? 'plusAsSpace' : undefined,
      } satisfies UcdInsetOptions,
    },
    serializer: {
      use: 'ucsProcessCharge',
      from: COMPILER_MODULE,
    },
  };
}

/**
 * Options for {@link ucFormatCharge URI charge} formatting.
 */
export interface UcChargeOptions {
  /**
   * Whether to decode _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space padding}.
   *
   * @defaultValue `false`
   */
  readonly plusAsSpace?: boolean | undefined;
}
