import type { UcvStringLength } from '../../compiler/validation/ucv-support-string-length.js';
import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../uc-constraints.js';
import { UcString } from './uc-string.js';

export function ucMinLength(
  atLeast: number,
  message?: string,
): UcConstraints<UcString, UcString.Schema> {
  return ucvValidateStringLength(['>=', atLeast, message]);
}

export function ucMaxLength(
  atMost: number,
  message?: string,
): UcConstraints<UcString, UcString.Schema> {
  return ucvValidateStringLength(['<=', atMost, message]);
}

function ucvValidateStringLength(
  options: UcvStringLength,
): UcConstraints<UcString, UcString.Schema> {
  return {
    validator: {
      use: 'ucvSupportStringLength',
      from: COMPILER_MODULE,
      with: options,
    },
  };
}
