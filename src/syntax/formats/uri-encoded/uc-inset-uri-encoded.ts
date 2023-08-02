import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-process-inset.js';
import { UcsInsetOptions } from '../../../compiler/serialization/ucs-process-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables inset processing as {@link UcPlainTextLexer URI-encoded text}.
 *
 * @param options - Lexer options.
 *
 * @returns Schema constraints.
 */

export function ucInsetURIEncoded(options?: {
  /**
   * Whether to decode _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space padding}.
   *
   * @defaultValue `false`
   */
  readonly plusAsSpace?: boolean | undefined;
  /**
   * Whether to emit a raw string rather quoted string.
   *
   * @defaultValue `false`.
   */
  readonly raw?: boolean | undefined;
}): UcOmniConstraints;

export function ucInsetURIEncoded({
  plusAsSpace,
  raw,
}: {
  readonly plusAsSpace?: boolean | undefined;
  readonly raw?: boolean | undefined;
} = {}): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdProcessInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcURIEncodedLexer',
        from: CHURI_MODULE,
        method: plusAsSpace ? 'plusAsSpace' : undefined,
        args: raw ? [`true`] : undefined,
      } satisfies UcdInsetOptions,
    },
    serializer: {
      use: 'ucsProcessInset',
      from: COMPILER_MODULE,
      with: {
        format: 'uriEncoded',
      } satisfies UcsInsetOptions,
    },
  };
}
