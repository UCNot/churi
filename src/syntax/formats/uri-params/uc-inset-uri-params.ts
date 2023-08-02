import { esStringLiteral } from 'esgen';
import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-process-inset.js';
import { UcsInsetOptions } from '../../../compiler/serialization/ucs-process-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables inset processing as {@link UcURIParamsLexer URI params}.
 *
 * E.g. for `application/x-www-form-urlencoded` processing.
 *
 * @param splitter - Parameters splitter character.
 *
 * Either `'&'` (by default), or `';'`.
 *
 * @returns Schema constraints.
 */

export function ucInsetURIParams(splitter?: '&' | ';'): UcOmniConstraints {
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
    serializer: {
      use: 'ucsProcessInset',
      from: COMPILER_MODULE,
      with: {
        format: 'uriParams',
      } satisfies UcsInsetOptions,
    },
  };
}
