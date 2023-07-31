import type { UcvStringLength } from '../../compiler/validation/ucv-process-string-length.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { UcString } from './uc-string.js';

export function ucItHasMinChars(
  minChars: number,
  message?: string,
): UcConstraints<UcString, UcString.Schema> {
  return ucvValidateStringLength(['ItHasMinChars', minChars, message]);
}

export function ucItHasMaxChars(
  maxChars: number,
  message?: string,
): UcConstraints<UcString, UcString.Schema> {
  return ucvValidateStringLength(['ItHasMaxChars', maxChars, message]);
}

function ucvValidateStringLength(
  options: UcvStringLength,
): UcConstraints<UcString, UcString.Schema> {
  return {
    validator: {
      use: 'ucvProcessStringLength',
      from: COMPILER_MODULE,
      with: options,
    },
  };
}
