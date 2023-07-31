import { UcvStringPattern } from '../../compiler/validation/ucv-process-string-pattern.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { UcString } from './uc-string.js';

export function ucItMatches(
  pattern: RegExp,
  message?: string,
): UcConstraints<UcString, UcString.Schema> {
  return {
    validator: {
      use: 'ucvProcessStringPattern',
      from: COMPILER_MODULE,
      with: [pattern, message] satisfies UcvStringPattern,
    },
  };
}
