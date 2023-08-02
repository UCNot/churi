import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-process-inset.js';
import { UcsInsetOptions } from '../../../compiler/serialization/ucs-process-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables inset processing as {@link UcPlainTextLexer plain text}.
 *
 * @param options - Lexer options.
 *
 * @returns Schema constraints.
 */

export function ucInsetPlainText(options?: {
  /**
   * Whether to emit a raw string rather quoted string.
   *
   * @defaultValue `false`.
   */
  readonly raw?: boolean | undefined;
}): UcOmniConstraints;

export function ucInsetPlainText({
  raw,
}: {
  readonly raw?: boolean | undefined;
} = {}): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdProcessInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcPlainTextLexer',
        from: CHURI_MODULE,
        args: raw ? [`true`] : undefined,
      } satisfies UcdInsetOptions,
    },
    serializer: {
      use: 'ucsProcessInset',
      from: COMPILER_MODULE,
      with: {
        format: 'plainText',
      } satisfies UcsInsetOptions,
    },
  };
}
