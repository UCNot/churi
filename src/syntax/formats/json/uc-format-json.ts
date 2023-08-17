import { UcdFormatOptions } from '../../../compiler/deserialization/ucd-process-format.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';

/**
 * Enables {@link UcJSONLexer JSON} format for schema or inset.
 *
 * @returns Schema constraints.
 */
export function ucFormatJSON(): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdProcessFormat',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcJSONLexer',
        from: CHURI_MODULE,
      } satisfies UcdFormatOptions,
    },
  };
}
