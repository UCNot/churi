import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-process-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables {@link UcJsonLexer JSON} format for schema or inset.
 *
 * @returns Schema constraints.
 */
export function ucFormatJSON(): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdProcessInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcJSONLexer',
        from: CHURI_MODULE,
      } satisfies UcdInsetOptions,
    },
    serializer: {
      use: 'ucsProcessPlainText',
      from: COMPILER_MODULE,
    },
  };
}
