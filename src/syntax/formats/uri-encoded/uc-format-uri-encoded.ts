import { UcdFormatOptions } from '../../../compiler/deserialization/ucd-process-format.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables {@link UcPlainTextLexer URI-encoded text} format for schema or inset.
 *
 * @param options - Formatting options.
 *
 * @returns Schema constraints.
 */
export function ucFormatURIEncoded(options?: UcURIEncodedOptions): UcOmniConstraints;

export function ucFormatURIEncoded({
  plusAsSpace,
  raw,
}: UcURIEncodedOptions = {}): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdProcessFormat',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcURIEncodedLexer',
        from: CHURI_MODULE,
        method: plusAsSpace ? 'plusAsSpace' : undefined,
        args: raw ? [`true`] : undefined,
      } satisfies UcdFormatOptions,
    },
    serializer: {
      use: 'ucsProcessURIEncoded',
      from: COMPILER_MODULE,
    },
  };
}

/**
 * Options for {@link ucFormatURIEncoded URI-encoded text} formatting.
 */
export interface UcURIEncodedOptions {
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
}
