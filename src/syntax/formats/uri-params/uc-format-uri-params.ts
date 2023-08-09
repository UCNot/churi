import { esStringLiteral } from 'esgen';
import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-process-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';
import { UcFormatName } from '../../../schema/uc-presentations.js';

/**
 * Enables {@link UcURIParamsLexer URI parameters} format for the schema or inset.
 *
 * E.g. for `application/x-www-form-urlencoded` processing.
 *
 * @param options - Formatting options.
 *
 * @returns Schema constraints.
 */
export function ucFormatURIParams(options?: UcURIParamsOptions): UcOmniConstraints {
  const splitter = options?.splitter;

  return {
    deserializer: {
      use: 'ucdProcessInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcURIParamsLexer',
        from: CHURI_MODULE,
        args: splitter ? [esStringLiteral(splitter)] : undefined,
      } satisfies UcdInsetOptions,
    },
    serializer: [
      {
        use: 'ucsProcessURIParams',
        from: COMPILER_MODULE,
        with: options,
      },
    ],
  };
}

/**
 * Options of {@link ucFormatURIParams URI parameters} formatting.
 */
export interface UcURIParamsOptions {
  /**
   * Format to use for each parameter, unless overridden.
   *
   * @defaultValue `'charge'`
   */
  readonly paramFormat?: UcFormatName | undefined;

  /**
   * Parameters splitter character.
   *
   * Either `'&'`, or `';'`.
   *
   * @defaultValue `'&'`
   */
  readonly splitter?: ';' | '&' | undefined;
}
