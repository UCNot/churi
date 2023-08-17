import { UcdFormatOptions } from '../../../compiler/deserialization/ucd-process-format.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables {@link UcPlainTextLexer plain text} format for schema or inset.
 *
 * @param options - Formatting options.
 *
 * @returns Schema constraints.
 */
export function ucFormatPlainText(options?: UcPlainTextOptions): UcOmniConstraints;

export function ucFormatPlainText({ raw }: UcPlainTextOptions = {}): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdProcessFormat',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcPlainTextLexer',
        from: CHURI_MODULE,
        args: raw ? [`true`] : undefined,
      } satisfies UcdFormatOptions,
    },
    serializer: {
      use: 'ucsProcessPlainText',
      from: COMPILER_MODULE,
    },
  };
}

/**
 * Options for {@link ucFormatPlainText plain text} formatting.
 */
export interface UcPlainTextOptions {
  /**
   * Whether to emit a raw string rather quoted string.
   *
   * @defaultValue `false`.
   */
  readonly raw?: boolean | undefined;
}
