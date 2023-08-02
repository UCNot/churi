import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-process-inset.js';
import { UcsInsetOptions } from '../../../compiler/serialization/ucs-process-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables processing of inset encoded with {@link UcChargeLexer URI Charge Notation}.
 *
 * @param options - Lexer options.
 *
 * @returns Schema constraints.
 */

export function ucInsetCharge(options?: {
  /**
   * Whether to decode _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space padding}.
   *
   * @defaultValue `false`
   */
  readonly plusAsSpace?: boolean | undefined;
}): UcOmniConstraints;

export function ucInsetCharge({
  plusAsSpace,
}: {
  readonly plusAsSpace?: boolean | undefined;
} = {}): UcOmniConstraints {
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
      use: 'ucsProcessInset',
      from: COMPILER_MODULE,
      with: {
        format: 'charge',
      } satisfies UcsInsetOptions,
    },
  };
}
